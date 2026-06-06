"use client";
import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert } from "@/types/database";
import { todayISO } from "@/lib/utils";

type Appointment = Tables<"appointments">;
type PatientLite = Pick<Tables<"patients">, "id" | "full_name" | "phone" | "age" | "gender">;

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToday = useCallback(async (doctorId?: string) => {
    setLoading(true);
    try {
      const supabase = createClient();
      // Step 1: Fetch appointments (no joins to avoid RLS circular issues)
      let q = supabase
        .from("appointments")
        .select("id, status, token_number, patient_id, doctor_id, appointment_date, fee_paid, consultation_fee, clinic_id, receptionist_id, appointment_time, notes, created_at, updated_at")
        .eq("appointment_date", todayISO())
        .order("token_number");
      if (doctorId) q = q.eq("doctor_id", doctorId);
      const { data: apts, error } = await q;
      if (error) throw error;

      // Step 2: Fetch patient names separately to avoid RLS join issues
      const aptData = (apts as Appointment[]) ?? [];
      if (aptData.length === 0) {
        setAppointments([]);
        return;
      }
      const patientIds = [...new Set(aptData.map((a) => a.patient_id))];
      const { data: patients } = await supabase
        .from("patients")
        .select("id, full_name, phone, age, gender")
        .in("id", patientIds);

      const patientMap = new Map(((patients as PatientLite[]) ?? []).map((p) => [p.id, p]));

      // Step 3: Merge data
      const merged = aptData.map((a) => ({
        ...a,
        patients: patientMap.get(a.patient_id) ?? null,
      }));
      setAppointments(merged as Appointment[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(
    async (apt: Omit<TablesInsert<"appointments">, "clinic_id" | "token_number">) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { error: "Not authenticated — please sign in again." };

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("clinic_id")
        .eq("id", user.id)
        .single();
      if (profileError) return { error: `Could not load your profile: ${profileError.message}` };
      if (!profile?.clinic_id) return { error: "Your account is not attached to any clinic." };

      const tokenResp = await supabase.rpc("next_token_number", {
        p_clinic_id: profile.clinic_id,
        p_date: apt.appointment_date ?? todayISO(),
      });
      if (tokenResp.error) {
        return { error: `Could not allocate token: ${tokenResp.error.message}` };
      }
      const tokenNumber = (tokenResp.data as number | null) ?? 1;

      const { data, error } = await supabase
        .from("appointments")
        .insert({
          ...apt,
          clinic_id: profile.clinic_id,
          token_number: tokenNumber,
          receptionist_id: user.id,
        })
        .select()
        .single();

      if (error) {
        // 42501 = RLS denial in Postgres
        const code = (error as { code?: string }).code;
        if (code === "42501" || /row-level security/i.test(error.message)) {
          return {
            error:
              "Permission denied — make sure you and the selected doctor are in the same clinic.",
          };
        }
        return { error: error.message };
      }
      return { data: data as Appointment };
    },
    [],
  );

  const updateStatus = useCallback(async (id: string, status: Appointment["status"]) => {
    const supabase = createClient();
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    return { error: error?.message };
  }, []);

  return { appointments, loading, error, fetchToday, create, updateStatus };
}
