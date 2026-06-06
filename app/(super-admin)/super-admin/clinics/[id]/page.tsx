import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClinicStatusToggle } from "@/components/super-admin/ClinicStatusToggle";

export default async function ClinicDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: clinic } = await supabase.from("clinics").select("*").eq("id", id).single();
  if (!clinic) notFound();

  const [{ count: userCount }, { count: patientCount }, { count: rxCount }] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).eq("clinic_id", id),
    supabase.from("patients").select("id", { count: "exact", head: true }).eq("clinic_id", id),
    supabase.from("prescriptions").select("id", { count: "exact", head: true }).eq("clinic_id", id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{clinic.name}</h1>
          <Badge variant={clinic.is_active ? "success" : "secondary"}>
            {clinic.is_active ? "Active" : "Disabled"}
          </Badge>
        </div>
        <ClinicStatusToggle clinicId={clinic.id} isActive={!!clinic.is_active} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Users</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{userCount ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Patients</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{patientCount ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Prescriptions</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{rxCount ?? 0}</CardContent>
        </Card>
      </div>
    </div>
  );
}
