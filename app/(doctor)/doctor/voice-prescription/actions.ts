"use server";

import { createClient } from "@/lib/supabase/server";
import { generatePrescriptionPDF, type PrescriptionPDFData } from "@/lib/pdf/generatePrescriptionPDF";
import { sendNotification, pickChannel } from "@/lib/notifications";
import type { StructuredPrescription } from "@/lib/ai";
import { addDaysISO } from "@/lib/utils";

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
  emailed?: boolean;
  emailError?: string;
  whatsAppSent?: boolean;
  whatsAppError?: string;
  followUpId?: string;
  error?: string;
}

export async function saveAndShipPrescription(args: SaveArgs): Promise<SaveResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: doctor } = await supabase
    .from("users")
    .select("id, full_name, clinic_id, clinics(name, address, phone), doctor_profiles(qualification, registration_no, consultation_fee)")
    .eq("id", user.id)
    .single();
  if (!doctor || doctor.clinic_id == null) return { error: "Doctor profile not found" };

  type ClinicEmbed = { name?: string; address?: string | null; phone?: string | null };
  type DocProfileEmbed = { qualification?: string | null; registration_no?: string | null; consultation_fee?: number | null };
  const clinic = (doctor as unknown as { clinics?: ClinicEmbed | ClinicEmbed[] | null }).clinics;
  const clinicData: ClinicEmbed | undefined = Array.isArray(clinic) ? clinic[0] : clinic ?? undefined;
  const docProfile = (doctor as unknown as { doctor_profiles?: DocProfileEmbed | DocProfileEmbed[] | null }).doctor_profiles;
  const docProfileData: DocProfileEmbed | undefined = Array.isArray(docProfile) ? docProfile[0] : docProfile ?? undefined;

  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, age, gender, email, phone")
    .eq("id", args.patientId)
    .single();
  if (!patient) return { error: "Patient not found" };

  // Pre-flight: make sure the `prescriptions` storage bucket exists. If it
  // doesn't, fail BEFORE inserting the prescription row so we don't leave a
  // dangling row without a PDF.
  {
    const probe = await supabase.storage.from("prescriptions").list("", { limit: 1 });
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

  const { data: rxRow, error: rxError } = await supabase
    .from("prescriptions")
    .insert({
      clinic_id: doctor.clinic_id,
      doctor_id: doctor.id,
      patient_id: patient.id,
      appointment_id: args.appointmentId ?? null,
      diagnosis: args.prescription.diagnosis,
      chief_complaint: args.prescription.chiefComplaint || null,
      medicines: args.prescription.medicines,
      lab_tests: args.prescription.labTests,
      advice: args.prescription.advice || null,
      follow_up_days: args.prescription.followUpDays ?? null,
      is_ai_generated: args.isAiGenerated,
      raw_voice_text: args.rawVoiceText ?? null,
      clinical_summary: args.prescription.clinicalSummary || null,
      transcription_language: args.transcriptionLanguage || "en",
    })
    .select("id")
    .single();
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

  const pdfData: PrescriptionPDFData = {
    doctorName: doctor.full_name,
    qualification: docProfileData?.qualification ?? null,
    registrationNo: docProfileData?.registration_no ?? null,
    clinicName: clinicData?.name ?? "Clinic",
    clinicAddress: clinicData?.address ?? null,
    clinicPhone: clinicData?.phone ?? null,
    patientName: patient.full_name,
    patientAge: patient.age ?? null,
    patientGender: patient.gender ?? null,
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

  const { error: uploadError } = await supabase.storage
    .from("prescriptions")
    .upload(pdfPath, pdfArrayBuffer, { contentType: "application/pdf", upsert: true });
  if (uploadError) {
    // Roll back the prescription row so the doctor isn't stuck with a half-saved Rx.
    await supabase.from("prescriptions").delete().eq("id", rxRow.id);
    return { error: `PDF upload failed: ${uploadError.message}` };
  }

  const { data: signed } = await supabase.storage
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

  let emailed = false;
  let emailError: string | undefined;
  if (args.sendEmail && patient.email && pdfUrl) {
    const pdfContent = Buffer.from(pdfArrayBuffer);
    const result = await sendNotification({
      channel: "email",
      to: patient.email,
      subject: `Your prescription from Dr. ${doctor.full_name}`,
      body: `Hello ${patient.full_name},\n\nYour prescription from Dr. ${doctor.full_name} at ${clinicData?.name ?? "the clinic"} is attached and also available here:\n${pdfUrl}\n\nDiagnosis: ${args.prescription.diagnosis}\n\nThank you,\n${clinicData?.name ?? "MediSync"}`,
      attachments: [{ filename: `prescription-${rxRow.id}.pdf`, content: pdfContent, contentType: "application/pdf" }],
    });
    emailed = result.ok;
    emailError = result.error;

    await supabase.from("notifications").insert({
      clinic_id: doctor.clinic_id,
      recipient_type: "patient",
      recipient_id: patient.id,
      type: "prescription_email",
      channel: "email",
      subject: `Your prescription from Dr. ${doctor.full_name}`,
      body: `Prescription ${rxRow.id}`,
      status: emailed ? "sent" : "failed",
      sent_at: emailed ? new Date().toISOString() : null,
      metadata: emailError ? { error: emailError } : {},
    });
  }

  let whatsAppSent = false;
  let whatsAppError: string | undefined;
  if (args.sendWhatsApp && patient.phone && pdfUrl) {
    const result = await sendNotification({
      channel: "whatsapp",
      to: patient.phone,
      body: `Hello ${patient.full_name},\n\nYour prescription from Dr. ${doctor.full_name} at ${clinicData?.name ?? "the clinic"} is ready.\n\nYou can view and download it here: ${pdfUrl}\n\nDiagnosis: ${args.prescription.diagnosis}`,
    });
    whatsAppSent = result.ok;
    whatsAppError = result.error;

    await supabase.from("notifications").insert({
      clinic_id: doctor.clinic_id,
      recipient_type: "patient",
      recipient_id: patient.id,
      type: "prescription_whatsapp",
      channel: "whatsapp",
      body: `Prescription ${rxRow.id}`,
      status: whatsAppSent ? "sent" : "failed",
      sent_at: whatsAppSent ? new Date().toISOString() : null,
      metadata: whatsAppError ? { error: whatsAppError } : {},
    });
  }

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

  return {
    prescriptionId: rxRow.id,
    pdfUrl,
    pdfPath,
    emailed,
    emailError,
    whatsAppSent,
    whatsAppError,
    followUpId,
  };
}
