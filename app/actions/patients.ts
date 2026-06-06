"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { GenderType } from "@/lib/constants";

export interface PatientFormData {
  full_name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  age?: number | null;
  gender?: GenderType | null;
  blood_group?: string | null;
  allergies?: string[] | null;
  notes?: string | null;
  date_of_birth?: string | null;
}

export interface VitalsFormData {
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  weight_kg?: number | null;
  temperature_f?: number | null;
  pulse_rate?: number | null;
  spo2?: number | null;
  height_cm?: number | null;
  bmi?: number | null;
}

export interface CreatePatientResult {
  success: boolean;
  patientId?: string;
  error?: string;
}

export async function createPatientAction(
  patientData: PatientFormData,
  vitalsData?: VitalsFormData | null,
): Promise<CreatePatientResult> {
  try {
    // Step 1: Authenticate with the user-context client (has auth session via cookies)
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
      return { success: false, error: "User profile not found. Please contact admin." };
    }

    if (!profile.clinic_id) {
      return { success: false, error: "No clinic assigned to your account." };
    }

    // Validate required fields
    if (!patientData.full_name?.trim()) {
      return { success: false, error: "Patient name is required." };
    }
    if (!patientData.phone?.trim()) {
      return { success: false, error: "Phone number is required." };
    }

    // Step 2: Use the service role client (bypasses RLS) to insert the patient
    const serviceClient = createServiceRoleClient();

    const { data: newPatient, error: insertError } = await serviceClient
      .from("patients")
      .insert({
        clinic_id: profile.clinic_id,
        created_by: profile.id,
        full_name: patientData.full_name.trim(),
        phone: patientData.phone.trim(),
        email: patientData.email || null,
        address: patientData.address || null,
        age: patientData.age ?? null,
        gender: patientData.gender || null,
        blood_group: patientData.blood_group || null,
        allergies: patientData.allergies || null,
        notes: patientData.notes || null,
        date_of_birth: patientData.date_of_birth || null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[createPatientAction] Insert error:", insertError);
      return { success: false, error: `Failed to create patient: ${insertError.message}` };
    }

    // Save vitals if provided
    if (vitalsData) {
      const hasVitals = Object.values(vitalsData).some((v) => v !== null && v !== undefined && v !== "");
      if (hasVitals) {
        const { error: vitalsError } = await serviceClient
          .from("patient_vitals")
          .insert({
            patient_id: newPatient.id,
            clinic_id: profile.clinic_id,
            recorded_by: profile.id,
            bp_systolic: vitalsData.bp_systolic ?? null,
            bp_diastolic: vitalsData.bp_diastolic ?? null,
            weight_kg: vitalsData.weight_kg ?? null,
            temperature_f: vitalsData.temperature_f ?? null,
            pulse_rate: vitalsData.pulse_rate ?? null,
            spo2: vitalsData.spo2 ?? null,
            height_cm: vitalsData.height_cm ?? null,
            bmi: vitalsData.bmi ?? null,
          });

        if (vitalsError) {
          console.warn("[createPatientAction] Vitals save warning:", vitalsError);
          // Don't fail the whole operation for vitals
        }
      }
    }

    return { success: true, patientId: newPatient.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("[createPatientAction]", message);
    return { success: false, error: message };
  }
}