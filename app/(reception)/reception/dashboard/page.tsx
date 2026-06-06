import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppointmentQueue } from "@/components/appointments/AppointmentQueue";
import { FollowUpManager } from "@/components/follow-ups/FollowUpManager";
import { ReceptionStats } from "@/components/reception/ReceptionStats";
import { PatientNotifier } from "@/components/reception/PatientNotifier";
import { UserPlus, Plus } from "lucide-react";
import { todayISO } from "@/lib/utils";

export default async function ReceptionDashboard() {
  const supabase = await createClient();
  const today = todayISO();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("users").select("clinic_id").eq("id", user.id).single()
    : { data: null };
  const clinicId = profile?.clinic_id;

  const [{ count: todayApts }, { count: patientCount }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId!)
      .eq("appointment_date", today),
    supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId!),
  ]);

  return (
    <div className="space-y-6">
      {/* Real-time patient alerts for the receptionist */}
      <PatientNotifier />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reception</h1>
          <p className="text-sm text-muted-foreground">Today&apos;s queue and follow-ups</p>
        </div>
        <div className="flex gap-2">
          <Link href="/reception/patients/new">
            <Button variant="outline">
              <UserPlus className="mr-2 h-4 w-4" /> New patient
            </Button>
          </Link>
          <Link href="/reception/appointments/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* Real-time stats counting cards */}
      <ReceptionStats
        initialTodayAppointments={todayApts ?? 0}
        initialPatientCount={patientCount ?? 0}
        clinicId={clinicId!}
      />

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s queue</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentQueue actionsScope="reception" />
        </CardContent>
      </Card>

      <FollowUpManager scope="clinic" />
    </div>
  );
}
