"use client";
import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert } from "@/types/database";

type Patient = Tables<"patients">;
type PatientInsert = TablesInsert<"patients">;

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      let query = supabase.from("patients").select("*").order("created_at", { ascending: false });
      if (search) query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      setPatients((data as Patient[]) ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, []);

  const createPatient = useCallback(async (patient: Omit<PatientInsert, "clinic_id">) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: userProfile } = await supabase.from("users").select("clinic_id").eq("id", user.id).single();
      if (!userProfile?.clinic_id) throw new Error("No clinic assigned");

      const { data, error } = await supabase
        .from("patients")
        .insert({ ...patient, clinic_id: userProfile.clinic_id, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      setPatients((prev) => [data as Patient, ...prev]);
      return { data: data as Patient, error: null as string | null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create patient";
      return { data: null, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return { patients, loading, error, fetchPatients, createPatient };
}
