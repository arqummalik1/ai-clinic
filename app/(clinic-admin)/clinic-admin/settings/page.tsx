import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Shield } from "lucide-react";

export default async function ClinicAdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, email, phone, role, clinic_id, clinics(name, address, phone)")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const clinic = Array.isArray((profile as any).clinics)
    ? (profile as any).clinics[0]
    : (profile as any).clinics;

  const clinicAdminSpecificSettings = (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Clinic information</CardTitle>
          </div>
          <CardDescription>Your clinic details and configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {clinic ? (
            <>
              <div className="space-y-1">
                <p className="text-sm font-medium">Clinic name</p>
                <p className="text-sm text-muted-foreground">{clinic.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm text-muted-foreground">{clinic.address || "Not set"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">{clinic.phone || "Not set"}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Contact super admin to update clinic information
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No clinic information found</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Staff management</CardTitle>
          </div>
          <CardDescription>Manage your clinic staff</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add doctors, receptionists, and manage their permissions through the Staff and Permissions pages
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Admin privileges</CardTitle>
          </div>
          <CardDescription>Your administrative capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Manage staff members and their roles</li>
            <li>• Configure permissions and access levels</li>
            <li>• View clinic-wide earnings and analytics</li>
            <li>• Manage clinic branding and settings</li>
          </ul>
        </CardContent>
      </Card>
    </>
  );

  return (
    <SettingsPage
      user={{
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
      }}
      roleSpecificSettings={clinicAdminSpecificSettings}
    />
  );
}
