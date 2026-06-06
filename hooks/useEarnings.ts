"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type EarningsFilter = "daily" | "weekly" | "monthly";

export function useEarnings(filter: EarningsFilter, doctorId?: string) {
  const [data, setData] = useState<{ date: string; amount: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const start = new Date();
        if (filter === "weekly") start.setDate(start.getDate() - 7);
        else if (filter === "monthly") start.setDate(start.getDate() - 30);
        else start.setHours(0, 0, 0, 0);

        let q = supabase
          .from("earnings")
          .select("amount, earned_date")
          .gte("earned_date", start.toISOString().split("T")[0])
          .order("earned_date");
        if (doctorId) q = q.eq("doctor_id", doctorId);

        const { data: rows, error } = await q;
        if (error) {
          console.error("[useEarnings] Supabase query error:", error);
          return;
        }
        if (!rows) return;

        const grouped: Record<string, number> = {};
        let sum = 0;
        for (const r of rows as { amount: number; earned_date: string }[]) {
          const amt = Number(r.amount);
          grouped[r.earned_date] = (grouped[r.earned_date] ?? 0) + amt;
          sum += amt;
        }
        if (active) {
          setData(Object.entries(grouped).map(([date, amount]) => ({ date, amount })));
          setTotal(sum);
        }
      } catch (err) {
        console.error("[useEarnings] Runtime error:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [filter, doctorId]);

  return { data, total, loading };
}
