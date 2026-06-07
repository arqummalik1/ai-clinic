import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DoctorCommandCenter } from "@/components/doctor/DoctorCommandCenter";
import { todayISO } from "@/lib/utils";

export default async function DoctorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = todayISO();

  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("id", user?.id ?? "")
    .single();

  const [{ count: todayAppointments }, { data: perms }, { count: totalPrescriptions }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("doctor_id", profile?.id ?? "")
      .eq("appointment_date", today),
    supabase
      .from("user_permissions")
      .select("can_view_earnings")
      .eq("user_id", profile?.id ?? "")
      .maybeSingle(),
    supabase
      .from("prescriptions")
      .select("id", { count: "exact", head: true })
      .eq("doctor_id", profile?.id ?? ""),
  ]);

  return (
    <DoctorCommandCenter
      doctorId={profile?.id ?? ""}
      doctorName={profile?.full_name ?? ""}
      initialTodayAppointments={todayAppointments ?? 0}
      initialTotalPrescriptions={totalPrescriptions ?? 0}
      canViewEarnings={perms?.can_view_earnings ?? false}
    />
  );
}
