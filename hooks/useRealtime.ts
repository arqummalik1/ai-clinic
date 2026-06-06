"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/utils";

type AppointmentRow = {
  id: string;
  status: string;
  token_number: number | null;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  fee_paid: boolean | null;
  consultation_fee: number | null;
  patients?: { full_name: string; phone: string | null; age: number | null; gender: string | null };
  users?: { full_name: string };
};

export function useRealtimeAppointments(doctorId?: string) {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);

  // Lazily create a single client instance for this hook.
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  if (supabaseRef.current === null) {
    supabaseRef.current = createClient();
  }
  const fetchDataRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const supabase = supabaseRef.current!;

    const fetchData = async () => {
      try {
        // Step 1: Fetch appointments (no joins to avoid RLS circular issues)
        let q = supabase
          .from("appointments")
          .select("id, status, token_number, patient_id, doctor_id, appointment_date, fee_paid, consultation_fee")
          .eq("appointment_date", todayISO())
          .order("token_number");
        if (doctorId) q = q.eq("doctor_id", doctorId);
        const { data: apts, error } = await q;
        if (error) {
          console.error("[useRealtimeAppointments] Supabase fetch error:", error);
          return;
        }
        if (!apts || apts.length === 0) {
          setAppointments([]);
          return;
        }

        // Step 2: Fetch patient names separately to avoid RLS join issues
        const patientIds = [...new Set(apts.map(a => a.patient_id))];
        const { data: patients } = await supabase
          .from("patients")
          .select("id, full_name, phone, age, gender")
          .in("id", patientIds);

        const patientMap = new Map((patients ?? []).map(p => [p.id, p]));

        // Step 3: Merge data
        const merged: AppointmentRow[] = apts.map(a => ({
          ...a as unknown as AppointmentRow,
          patients: patientMap.get(a.patient_id) ?? undefined,
        }));
        setAppointments(merged);
      } catch (err) {
        console.error("[useRealtimeAppointments] Runtime error:", err);
      }
    };

    fetchDataRef.current = fetchData;
    fetchData();

    const channel = supabase
      .channel("appointments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        if (fetchDataRef.current) fetchDataRef.current();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorId]); // Only re-subscribe when doctorId changes

  const refresh = useCallback(() => {
    if (fetchDataRef.current) fetchDataRef.current();
  }, []);

  return { appointments, refresh };
}
