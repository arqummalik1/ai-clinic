import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { EarningsChart } from "@/components/earnings/EarningsChart";
import { Calendar, Users, Stethoscope, IndianRupee } from "lucide-react";
import { formatCurrencyINR, todayISO } from "@/lib/utils";

export default async function ClinicAdminDashboard() {
  const supabase = await createClient();
  const today = todayISO();

  const { data: profile } = await supabase
    .from("users")
    .select("clinic_id, full_name, clinics(name)")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();

  const clinicId = profile?.clinic_id;
  const clinicName = (profile as { clinics?: { name?: string } } | null)?.clinics?.name ?? "your clinic";

  const [{ count: appointmentsToday }, { count: doctorCount }, { count: patientCount }, { data: todayEarnings }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId!)
        .eq("appointment_date", today),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId!)
        .eq("role", "doctor")
        .eq("is_active", true),
      supabase
        .from("patients")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId!),
      supabase
        .from("earnings")
        .select("amount")
        .eq("clinic_id", clinicId!)
        .eq("earned_date", today),
    ]);

  const todayRevenue = (todayEarnings ?? []).reduce((s, r) => s + Number(r.amount), 0);

  const stats = [
    { label: "Today's appointments", value: appointmentsToday ?? 0, icon: Calendar, color: "text-blue-600" },
    { label: "Today's revenue", value: formatCurrencyINR(todayRevenue), icon: IndianRupee, color: "text-emerald-600" },
    { label: "Active doctors", value: doctorCount ?? 0, icon: Stethoscope, color: "text-indigo-600" },
    { label: "Total patients", value: patientCount ?? 0, icon: Users, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {profile?.full_name?.split(" ")[0] ?? "Admin"}</h1>
        <p className="text-sm text-muted-foreground">Overview for {clinicName}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <p className="mt-2 text-2xl font-semibold">{s.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <EarningsChart />
    </div>
  );
}
