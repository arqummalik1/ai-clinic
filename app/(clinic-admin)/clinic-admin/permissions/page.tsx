import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Stethoscope } from "lucide-react";

export default async function PermissionsIndexPage() {
  const supabase = await createClient();
  const { data: doctors } = await supabase
    .from("users")
    .select("id, full_name, email, doctor_profiles(specialization)")
    .eq("role", "doctor")
    .eq("is_active", true)
    .order("full_name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Permissions</h1>
        <p className="text-sm text-muted-foreground">Pick a doctor to manage their access settings</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {doctors?.map((d) => {
          const profile = (d as { doctor_profiles?: { specialization?: string | null } | { specialization?: string | null }[] | null }).doctor_profiles;
          const spec = (Array.isArray(profile) ? profile[0] : profile)?.specialization;
          return (
            <Link key={d.id} href={`/clinic-admin/permissions/${d.id}`}>
              <Card className="cursor-pointer transition hover:shadow-md">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{d.full_name}</p>
                      <p className="text-xs text-muted-foreground">{spec ?? d.email}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
