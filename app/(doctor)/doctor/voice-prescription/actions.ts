"use server";

import { after } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { generatePrescriptionPDF, type PrescriptionPDFData, type PrescriptionImageAsset } from "@/lib/pdf/generatePrescriptionPDF";
import { sendNotification, pickChannel } from "@/lib/notifications";
import type { StructuredPrescription } from "@/lib/ai";
import { addDaysISO } from "@/lib/utils";

/**
 * Fetch a remote image (clinic logo / doctor signature) and return it as a
 * base64 data URL suitable for jsPDF.addImage. Best-effort: returns null on any
 * failure so PDF generation never breaks on a missing/invalid asset.
 * Uses a 2-second timeout to prevent long waits.
 */
async function fetchImageAsset(url?: string | null): Promise<PrescriptionImageAsset | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) }); // Reduced from 5s to 2s
    if (!res.ok) return null;
    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    const format: "PNG" | "JPEG" = contentType.includes("jpeg") || contentType.includes("jpg") ? "JPEG" : "PNG";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > 2_000_000) return null; // skip empty / oversized
    const mime = contentType || (format === "JPEG" ? "image/jpeg" : "image/png");
    return { dataUrl: `data:${mime};base64,${buf.toString("base64")}`, format };
  } catch {
    return null;
  }
}

export interface SaveArgs {
  patientId: string;
  appointmentId?: string | null;
  prescription: StructuredPrescription;
  rawVoiceText?: string;
  isAiGenerated: boolean;
  transcriptionLanguage?: string;
  sendEmail?: boolean;
  sendWhatsApp?: boolean;
}

export interface SaveResult {
  prescriptionId?: string;
  pdfUrl?: string;
  pdfPath?: string;
  /** Notifications are dispatched in the background after the response. */
  emailQueued?: boolean;
  whatsAppQueued?: boolean;
  followUpId?: string;
  error?: string;
}

export async function saveAndShipPrescription(args: SaveArgs): Promise<SaveResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: doctor } = await supabase
    .from("users")
    .select("id, full_name, clinic_id, clinics(name, address, phone, logo_url), doctor_profiles(qualification, degree, registration_no, consultation_fee, signature_url, prescription_header, prescription_footer)")
    .eq("id", user.id)
    .single();
  if (!doctor || doctor.clinic_id == null) return { error: "Doctor profile not found" };

  type ClinicEmbed = { name?: string; address?: string | null; phone?: string | null; logo_url?: string | null };
  type DocProfileEmbed = {
    qualification?: string | null;
    degree?: string | null;
    registration_no?: string | null;
    consultation_fee?: number | null;
    signature_url?: string | null;
    prescription_header?: string | null;
    prescription_footer?: string | null;
  };
  const clinic = (doctor as unknown as { clinics?: ClinicEmbed | ClinicEmbed[] | null }).clinics;
  const clinicData: ClinicEmbed | undefined = Array.isArray(clinic) ? clinic[0] : clinic ?? undefined;
  const docProfile = (doctor as unknown as { doctor_profiles?: DocProfileEmbed | DocProfileEmbed[] | null }).doctor_profiles;
  const docProfileData: DocProfileEmbed | undefined = Array.isArray(docProfile) ? docProfile[0] : docProfile ?? undefined;

  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, age, gender, email, phone, allergies")
    .eq("id", args.patientId)
    .single();
  if (!patient) return { error: "Patient not found" };

  // Pre-flight: make sure the `prescriptions` storage bucket exists. If it
  // doesn't, fail BEFORE inserting the prescription row so we don't leave a
  // dangling row without a PDF.
  // PDF Storage runs through the service-role client so the upload never fails
  // on a missing/mis-set Storage RLS policy. It's safe: this is a server action,
  // the user is already authenticated, and the path is scoped to their clinic.
  // Falls back to the user client if the service key isn't configured.
  const storage = (() => {
    try {
      return createServiceRoleClient();
    } catch {
      console.warn("[save] SUPABASE_SERVICE_ROLE_KEY missing — using user client for Storage.");
      return supabase;
    }
  })();

  {
    const probe = await storage.storage.from("prescriptions").list("", { limit: 1 });
    if (probe.error) {
      const msg = probe.error.message?.toLowerCase() ?? "";
      if (msg.includes("not found") || msg.includes("bucket")) {
        return {
          error:
            "Storage bucket 'prescriptions' is missing. Create a private bucket named 'prescriptions' in Supabase Storage, then retry.",
        };
      }
      return { error: `Storage check failed: ${probe.error.message}` };
    }
  }

  const todayISO = new Date().toISOString().split("T")[0];

  // Core columns guaranteed to exist; optional columns were added in later
  // migrations. If the DB is behind (PostgREST "could not find column"), we
  // retry with core-only so the doctor can still save. Run migration 0002 to
  // restore full fidelity (clinical summary, raw voice, language, etc.).
  const coreRow = {
    clinic_id: doctor.clinic_id,
    doctor_id: doctor.id,
    patient_id: patient.id,
    appointment_id: args.appointmentId ?? null,
    diagnosis: args.prescription.diagnosis,
    medicines: args.prescription.medicines,
    lab_tests: args.prescription.labTests,
    advice: args.prescription.advice || null,
    is_ai_generated: args.isAiGenerated,
  };
  const optionalRow = {
    chief_complaint: args.prescription.chiefComplaint || null,
    follow_up_days: args.prescription.followUpDays ?? null,
    raw_voice_text: args.rawVoiceText ?? null,
    clinical_summary: args.prescription.clinicalSummary || null,
    transcription_language: args.transcriptionLanguage || "en",
  };

  let rxRow: { id: string } | null = null;
  let rxError: { message: string } | null = null;
  {
    const res = await supabase.from("prescriptions").insert({ ...coreRow, ...optionalRow }).select("id").single();
    rxRow = res.data;
    rxError = res.error;
    if (rxError && /could not find the .* column|does not exist|schema cache/i.test(rxError.message)) {
      console.warn("[save] prescriptions table is missing optional columns — saving core fields only. Run supabase/migrations/0002. Detail:", rxError.message);
      const retry = await supabase.from("prescriptions").insert(coreRow).select("id").single();
      rxRow = retry.data;
      rxError = retry.error;
    }
  }
  if (rxError || !rxRow) return { error: rxError?.message ?? "Could not save prescription" };

  // Auto-record vitals if extracted/present in the prescription data
  if (args.prescription.vitals) {
    const v = args.prescription.vitals;
    if (
      v.bpSystolic != null ||
      v.bpDiastolic != null ||
      v.weightKg != null ||
      v.temperatureF != null ||
      v.pulseRate != null ||
      v.spo2 != null ||
      v.heightCm != null ||
      v.bmi != null
    ) {
      await supabase.from("patient_vitals").insert({
        patient_id: patient.id,
        clinic_id: doctor.clinic_id,
        appointment_id: args.appointmentId ?? null,
        bp_systolic: v.bpSystolic ?? null,
        bp_diastolic: v.bpDiastolic ?? null,
        weight_kg: v.weightKg ?? null,
        temperature_f: v.temperatureF ?? null,
        pulse_rate: v.pulseRate ?? null,
        spo2: v.spo2 ?? null,
        height_cm: v.heightCm ?? null,
        bmi: v.bmi ?? null,
        recorded_by: doctor.id,
      });
    }
  }

  // Fetch branding images in parallel (best-effort; null on failure).
  const [clinicLogo, signature] = await Promise.all([
    fetchImageAsset(clinicData?.logo_url),
    fetchImageAsset(docProfileData?.signature_url),
  ]);

  const pdfData: PrescriptionPDFData = {
    doctorName: doctor.full_name,
    qualification: docProfileData?.qualification ?? null,
    degree: docProfileData?.degree ?? null,
    registrationNo: docProfileData?.registration_no ?? null,
    clinicName: clinicData?.name ?? "Clinic",
    clinicAddress: clinicData?.address ?? null,
    clinicPhone: clinicData?.phone ?? null,
    clinicLogo,
    signature,
    prescriptionHeader: docProfileData?.prescription_header ?? null,
    prescriptionFooter: docProfileData?.prescription_footer ?? null,
    patientName: patient.full_name,
    patientAge: patient.age ?? null,
    patientGender: patient.gender ?? null,
    allergies: (patient as unknown as { allergies?: string[] | null }).allergies ?? null,
    vitals: args.prescription.vitals ?? null,
    date: todayISO,
    diagnosis: args.prescription.diagnosis,
    chiefComplaint: args.prescription.chiefComplaint,
    medicines: args.prescription.medicines,
    labTests: args.prescription.labTests,
    advice: args.prescription.advice,
    followUpDate: args.prescription.followUpDays ? addDaysISO(args.prescription.followUpDays) : null,
  };

  const doc = generatePrescriptionPDF(pdfData);
  const pdfBlob = doc.output("blob");
  const pdfArrayBuffer = await pdfBlob.arrayBuffer();
  const pdfPath = `${doctor.clinic_id}/${rxRow.id}.pdf`;

  const { error: uploadError } = await storage.storage
    .from("prescriptions")
    .upload(pdfPath, pdfArrayBuffer, { contentType: "application/pdf", upsert: true });
  if (uploadError) {
    // Roll back the prescription row so the doctor isn't stuck with a half-saved Rx.
    await supabase.from("prescriptions").delete().eq("id", rxRow.id);
    return { error: `PDF upload failed: ${uploadError.message}` };
  }

  const { data: signed } = await storage.storage
    .from("prescriptions")
    .createSignedUrl(pdfPath, 60 * 60 * 24 * 7);
  const pdfUrl = signed?.signedUrl;

  await supabase.from("prescriptions").update({ pdf_url: pdfUrl ?? null }).eq("id", rxRow.id);

  let followUpId: string | undefined;
  if (args.prescription.followUpDays && args.prescription.followUpDays > 0) {
    const followUpDate = addDaysISO(args.prescription.followUpDays);
    const channel = pickChannel({ email: patient.email, phone: patient.phone });
    const sendDate = addDaysISO(Math.max(1, args.prescription.followUpDays - 1));
    const { data: fu } = await supabase
      .from("follow_ups")
      .insert({
        clinic_id: doctor.clinic_id,
        patient_id: patient.id,
        doctor_id: doctor.id,
        prescription_id: rxRow.id,
        follow_up_date: followUpDate,
        scheduled_send_at: `${sendDate}T09:00:00+00:00`,
        notification_channel: channel,
        notified: false,
      })
      .select("id")
      .single();
    followUpId = fu?.id;
  }

  // Appointment completion + earnings are fast DB writes — keep them synchronous
  // so the queue/earnings reflect immediately when the doctor finishes.
  if (args.appointmentId) {
    await supabase
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", args.appointmentId);

    const fee = docProfileData?.consultation_fee ?? 0;
    if (fee > 0) {
      await supabase.from("earnings").insert({
        clinic_id: doctor.clinic_id,
        doctor_id: doctor.id,
        appointment_id: args.appointmentId,
        amount: fee,
        earned_date: todayISO,
      });
    }
  }

  // ---- Patient notifications dispatched in the BACKGROUND ----
  // Email (with PDF attachment) and WhatsApp involve third-party latency. We run
  // them after the response is sent so the doctor is cleared to the next patient
  // immediately instead of waiting on Resend/Twilio.
  const willEmail = !!(args.sendEmail && patient.email && pdfUrl);
  const willWhatsApp = !!(args.sendWhatsApp && patient.phone && pdfUrl);

  if (willEmail || willWhatsApp) {
    const pdfContent = Buffer.from(pdfArrayBuffer);
    const clinicName = clinicData?.name ?? "the clinic";
    const diagnosis = args.prescription.diagnosis;
    after(async () => {
      if (willEmail) {
        const result = await sendNotification({
          channel: "email",
          to: patient.email!,
          subject: `Your prescription from Dr. ${doctor.full_name}`,
          body: `Hello ${patient.full_name},\n\nYour prescription from Dr. ${doctor.full_name} at ${clinicName} is attached and also available here:\n${pdfUrl}\n\nDiagnosis: ${diagnosis}\n\nThank you,\n${clinicName}`,
          attachments: [{ filename: `prescription-${rxRow.id}.pdf`, content: pdfContent, contentType: "application/pdf" }],
        });
        await supabase.from("notifications").insert({
          clinic_id: doctor.clinic_id,
          recipient_type: "patient",
          recipient_id: patient.id,
          type: "prescription_email",
          channel: "email",
          subject: `Your prescription from Dr. ${doctor.full_name}`,
          body: `Prescription ${rxRow.id}`,
          status: result.ok ? "sent" : "failed",
          sent_at: result.ok ? new Date().toISOString() : null,
          metadata: result.error ? { error: result.error } : {},
        });
      }
      if (willWhatsApp) {
        const result = await sendNotification({
          channel: "whatsapp",
          to: patient.phone!,
          body: `Hello ${patient.full_name},\n\nYour prescription from Dr. ${doctor.full_name} at ${clinicName} is ready.\n\nYou can view and download it here: ${pdfUrl}\n\nDiagnosis: ${diagnosis}`,
        });
        await supabase.from("notifications").insert({
          clinic_id: doctor.clinic_id,
          recipient_type: "patient",
          recipient_id: patient.id,
          type: "prescription_whatsapp",
          channel: "whatsapp",
          body: `Prescription ${rxRow.id}`,
          status: result.ok ? "sent" : "failed",
          sent_at: result.ok ? new Date().toISOString() : null,
          metadata: result.error ? { error: result.error } : {},
        });
      }
    });
  }

  return {
    prescriptionId: rxRow.id,
    pdfUrl,
    pdfPath,
    emailQueued: willEmail,
    whatsAppQueued: willWhatsApp,
    followUpId,
  };
}

export interface FavoriteMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  count: number;
}

/**
 * Doctor Memory v1 — derive the doctor's personal medicine shelf from THEIR OWN
 * past prescriptions (not generic AI). Aggregates the most-prescribed medicines
 * and their most common regimen so the editor can offer one-tap, pre-filled adds.
 */
export async function getDoctorMedicineFavorites(limit = 24): Promise<FavoriteMedicine[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("prescriptions")
    .select("medicines")
    .eq("doctor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(400);
  if (error || !data) return [];

  type Agg = { name: string; count: number; regimens: Map<string, { combo: Omit<FavoriteMedicine, "name" | "count">; n: number }> };
  const byName = new Map<string, Agg>();

  for (const row of data) {
    const meds = Array.isArray(row.medicines) ? (row.medicines as unknown as StructuredPrescription["medicines"]) : [];
    for (const m of meds) {
      const name = (m?.name ?? "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const agg = byName.get(key) ?? { name, count: 0, regimens: new Map() };
      agg.count += 1;
      const combo = {
        dosage: (m.dosage ?? "").trim(),
        frequency: (m.frequency ?? "").trim(),
        duration: (m.duration ?? "").trim(),
        instructions: (m.instructions ?? "").trim(),
      };
      const comboKey = `${combo.dosage}|${combo.frequency}|${combo.duration}|${combo.instructions}`;
      const existing = agg.regimens.get(comboKey);
      if (existing) existing.n += 1;
      else agg.regimens.set(comboKey, { combo, n: 1 });
      byName.set(key, agg);
    }
  }

  const favorites: FavoriteMedicine[] = [];
  for (const agg of byName.values()) {
    let best: { combo: Omit<FavoriteMedicine, "name" | "count">; n: number } | null = null;
    for (const r of agg.regimens.values()) {
      if (!best || r.n > best.n) best = r;
    }
    favorites.push({ name: agg.name, count: agg.count, ...(best?.combo ?? { dosage: "", frequency: "", duration: "", instructions: "" }) });
  }

  favorites.sort((a, b) => b.count - a.count);
  return favorites.slice(0, limit);
}

export interface PrescriptionHeaderInfo {
  doctorName: string;
  qualification: string | null;
  degree: string | null;
  registrationNo: string | null;
  clinicName: string;
  clinicAddress: string | null;
  clinicPhone: string | null;
}

/** Header/footer details for the on-screen prescription paper (matches the PDF). */
export async function getPrescriptionHeader(): Promise<PrescriptionHeaderInfo | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: doctor } = await supabase
    .from("users")
    .select("full_name, clinics(name, address, phone), doctor_profiles(qualification, degree, registration_no)")
    .eq("id", user.id)
    .single();
  if (!doctor) return null;

  type ClinicEmbed = { name?: string; address?: string | null; phone?: string | null };
  type DocProfileEmbed = { qualification?: string | null; degree?: string | null; registration_no?: string | null };
  const clinic = (doctor as unknown as { clinics?: ClinicEmbed | ClinicEmbed[] | null }).clinics;
  const clinicData = Array.isArray(clinic) ? clinic[0] : clinic ?? undefined;
  const dp = (doctor as unknown as { doctor_profiles?: DocProfileEmbed | DocProfileEmbed[] | null }).doctor_profiles;
  const dpData = Array.isArray(dp) ? dp[0] : dp ?? undefined;

  return {
    doctorName: (doctor as unknown as { full_name: string }).full_name,
    qualification: dpData?.qualification ?? null,
    degree: dpData?.degree ?? null,
    registrationNo: dpData?.registration_no ?? null,
    clinicName: clinicData?.name ?? "Clinic",
    clinicAddress: clinicData?.address ?? null,
    clinicPhone: clinicData?.phone ?? null,
  };
}
