import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Database, Activity } from "lucide-react";

export default async function SuperAdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, email, phone, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const superAdminSpecificSettings = (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <CardTitle>Super Admin privileges</CardTitle>
          </div>
          <CardDescription>Platform-wide administrative access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Full access to all clinics and their data</li>
            <li>• Create and manage clinic accounts</li>
            <li>• View platform-wide analytics</li>
            <li>• System configuration and maintenance</li>
            <li>• User and permission management across all clinics</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>System settings</CardTitle>
          </div>
          <CardDescription>Platform configuration options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Database status</p>
            <p className="text-sm text-muted-foreground">Connected and operational</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">API version</p>
            <p className="text-sm text-muted-foreground">v1.0.0</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Environment</p>
            <p className="text-sm text-muted-foreground">Production</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Platform monitoring</CardTitle>
          </div>
          <CardDescription>System health and performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Access detailed system logs and analytics through the Analytics dashboard
          </p>
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
      roleSpecificSettings={superAdminSpecificSettings}
    />
  );
}
