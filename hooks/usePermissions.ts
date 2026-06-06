"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";

export function usePermissions() {
  const [permissions, setPermissions] = useState<Tables<"user_permissions"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from("user_permissions").select("*").eq("user_id", user.id).single();
      setPermissions(data as Tables<"user_permissions"> | null);
      setLoading(false);
    };
    load();
  }, []);

  return { permissions, loading };
}
