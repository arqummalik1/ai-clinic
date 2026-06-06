import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppointmentQueue } from "@/components/appointments/AppointmentQueue";
import { EarningsChart } from "@/components/earnings/EarningsChart";
import { DoctorStats } from "@/components/doctor/DoctorStats";
import { Mic } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome, Dr. {profile?.full_name?.split(" ")[0] ?? ""}
          </h1>
          <p className="text-sm text-muted-foreground">Here&apos;s your day</p>
        </div>
        <Link href="/doctor/voice-prescription">
          <Button size="lg" className="bg-red-500 hover:bg-red-600">
            <Mic className="mr-2 h-5 w-5" /> Voice prescribe
          </Button>
        </Link>
      </div>

      {/* Real-time stats counting cards */}
      <DoctorStats
        initialTodayAppointments={todayAppointments ?? 0}
        initialTotalPrescriptions={totalPrescriptions ?? 0}
        doctorId={profile?.id ?? ""}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s queue</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentQueue doctorId={profile?.id} showVoiceCta />
          </CardContent>
        </Card>
        {perms?.can_view_earnings && (
          <div className="space-y-4">
            <EarningsChart doctorId={profile?.id} />
          </div>
        )}
      </div>
    </div>
  );
}
