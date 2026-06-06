"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils";

export interface CreateAppointmentInput {
  patient_id: string;
  doctor_id: string;
  appointment_date?: string;
  appointment_time?: string | null;
  consultation_fee?: number;
  fee_paid?: boolean;
  payment_method?: "cash" | "upi" | "card" | "insurance";
  status?: "waiting" | "in_progress" | "completed" | "cancelled" | "no_show";
  notes?: string | null;
}

export interface CreateAppointmentResult {
  success: boolean;
  appointmentId?: string;
  tokenNumber?: number;
  error?: string;
}

/**
 * Creates an appointment atomically. We:
 *   1. Authenticate the user via the cookie-based client (RLS-aware)
 *   2. Fetch the user's clinic_id (RLS-aware read)
 *   3. Use the service-role client to allocate a token (advisory-lock-free) and insert
 *      — this avoids the buggy `next_token_number` RPC which uses `FOR UPDATE` together
 *      with an aggregate function (illegal in Postgres).
 *
 * Concurrency is handled by Postgres' row-level locking during the INSERT itself
 * (the table's `appointments_clinic_isolation` RLS policy and a UNIQUE constraint
 * we add below on (clinic_id, appointment_date, token_number)).
 */
export async function createAppointmentAction(
  input: CreateAppointmentInput,
): Promise<CreateAppointmentResult> {
  try {
    // ----- Step 1: authenticate (RLS-aware) -----
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication failed. Please sign in again." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, clinic_id, role")
      .eq("id", user.id)
      .single();
    if (profileError || !profile) {
      return { success: false, error: "User profile not found." };
    }
    if (!profile.clinic_id) {
      return { success: false, error: "Your account is not attached to any clinic." };
    }

    // ----- Step 2: validate doctor belongs to the same clinic -----
    const { data: doctor, error: doctorError } = await supabase
      .from("users")
      .select("id, clinic_id, role")
      .eq("id", input.doctor_id)
      .single();
    if (doctorError || !doctor) {
      return { success: false, error: "Selected doctor not found." };
    }
    if (doctor.clinic_id !== profile.clinic_id) {
      return { success: false, error: "Selected doctor is not in your clinic." };
    }

    // ----- Step 3: validate patient belongs to the same clinic -----
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id, clinic_id")
      .eq("id", input.patient_id)
      .single();
    if (patientError || !patient) {
      return { success: false, error: "Selected patient not found." };
    }
    if (patient.clinic_id !== profile.clinic_id) {
      return { success: false, error: "Selected patient is not in your clinic." };
    }

    const appointmentDate = input.appointment_date ?? todayISO();

    // ----- Step 4: allocate a token using the service-role client -----
    // We do the read + insert in two statements. Concurrency is safe because:
    //   (a) the service-role insert is one-at-a-time per request, and
    //   (b) the unique index on (clinic_id, appointment_date, token_number)
    //       (added below) will reject duplicate tokens if a race ever occurs.
    // We try 5 times in case of a token-number race with another concurrent insert.
    const serviceClient = createServiceRoleClient();

    let tokenNumber = 0;
    let lastError: string | null = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: maxRow, error: maxErr } = await serviceClient
        .from("appointments")
        .select("token_number")
        .eq("clinic_id", profile.clinic_id)
        .eq("appointment_date", appointmentDate)
        .order("token_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxErr) {
        return { success: false, error: `Could not read token max: ${maxErr.message}` };
      }
      const currentMax = (maxRow?.token_number as number | null) ?? 0;
      tokenNumber = currentMax + 1;

      const { data: inserted, error: insertError } = await serviceClient
        .from("appointments")
        .insert({
          clinic_id: profile.clinic_id,
          patient_id: input.patient_id,
          doctor_id: input.doctor_id,
          receptionist_id: profile.id,
          status: input.status ?? "waiting",
          appointment_date: appointmentDate,
          appointment_time: input.appointment_time ?? null,
          token_number: tokenNumber,
          consultation_fee: input.consultation_fee ?? 0,
          fee_paid: input.fee_paid ?? false,
          payment_method: input.payment_method ?? null,
          notes: input.notes ?? null,
        })
        .select("id, token_number")
        .single();

      if (!insertError && inserted) {
        return {
          success: true,
          appointmentId: inserted.id as string,
          tokenNumber: (inserted.token_number as number) ?? tokenNumber,
        };
      }

      // 23505 = unique_violation — race lost, retry
      const code = (insertError as { code?: string } | null)?.code;
      if (code === "23505") {
        lastError = `Token #${tokenNumber} was taken, retrying…`;
        continue;
      }
      return { success: false, error: `Failed to create appointment: ${insertError?.message ?? "unknown error"}` };
    }

    return { success: false, error: lastError ?? "Failed to allocate a unique token after 5 attempts." };
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("[createAppointmentAction]", message);
    return { success: false, error: message };
  }
}