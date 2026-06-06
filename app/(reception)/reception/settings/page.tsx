import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";

export default async function ReceptionistSettingsPage() {
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

  const receptionistSpecificSettings = (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <CardTitle>Receptionist preferences</CardTitle>
        </div>
        <CardDescription>Manage your workflow settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Default view</p>
          <p className="text-sm text-muted-foreground">
            Dashboard shows today's appointments by default
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Quick actions</p>
          <p className="text-sm text-muted-foreground">
            Access patient registration and appointment booking from any page
          </p>
        </div>
      </CardContent>
    </Card>
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
      roleSpecificSettings={receptionistSpecificSettings}
    />
  );
}
