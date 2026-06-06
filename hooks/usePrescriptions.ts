"use client";
import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert } from "@/types/database";

type Prescription = Tables<"prescriptions">;

export function usePrescriptions() {
  const [list, setList] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchForPatient = useCallback(async (patientId: string) => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("prescriptions")
      .select("*, patients(full_name, age, gender), users!doctor_id(full_name)")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });
    setList((data as Prescription[]) ?? []);
    setLoading(false);
  }, []);

  const create = useCallback(async (rx: Omit<TablesInsert<"prescriptions">, "clinic_id">) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    const { data: profile } = await supabase.from("users").select("clinic_id").eq("id", user.id).single();
    if (!profile?.clinic_id) return { error: "No clinic" };

    const { data, error } = await supabase
      .from("prescriptions")
      .insert({ ...rx, clinic_id: profile.clinic_id, doctor_id: user.id })
      .select()
      .single();
    if (error) return { error: error.message };
    return { data: data as Prescription };
  }, []);

  const updatePdfUrl = useCallback(async (id: string, pdf_url: string) => {
    const supabase = createClient();
    await supabase.from("prescriptions").update({ pdf_url }).eq("id", id);
  }, []);

  return { list, loading, fetchForPatient, create, updatePdfUrl };
}
