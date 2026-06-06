"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";

export function useClinic() {
  const [clinic, setClinic] = useState<Tables<"clinics"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: profile } = await supabase.from("users").select("clinic_id").eq("id", user.id).single();
      if (!profile?.clinic_id) { setLoading(false); return; }
      const { data } = await supabase.from("clinics").select("*").eq("id", profile.clinic_id).single();
      setClinic(data as Tables<"clinics"> | null);
      setLoading(false);
    };
    load();
  }, []);

  return { clinic, loading };
}
