import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, FileSignature, IndianRupee } from "lucide-react";

export default async function DoctorSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, email, phone, role, doctor_profiles(qualification, degree, registration_no, consultation_fee, signature_url)")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const doctorProfile = Array.isArray((profile as any).doctor_profiles)
    ? (profile as any).doctor_profiles[0]
    : (profile as any).doctor_profiles;

  const doctorSpecificSettings = (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            <CardTitle>Professional details</CardTitle>
          </div>
          <CardDescription>Your medical credentials and professional information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {doctorProfile ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Qualification</p>
                  <p className="text-sm text-muted-foreground">{doctorProfile.qualification || "Not set"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Degree</p>
                  <p className="text-sm text-muted-foreground">{doctorProfile.degree || "Not set"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Registration number</p>
                  <p className="text-sm text-muted-foreground">{doctorProfile.registration_no || "Not set"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Consultation fee</p>
                  <p className="text-sm text-muted-foreground">
                    ₹{doctorProfile.consultation_fee || 0}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Contact your clinic admin to update professional details
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No professional profile found. Contact your clinic admin.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            <CardTitle>Prescription settings</CardTitle>
          </div>
          <CardDescription>Manage your prescription preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Digital signature</p>
            <p className="text-sm text-muted-foreground">
              {doctorProfile?.signature_url ? "Signature uploaded" : "No signature uploaded"}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload your signature through clinic admin settings
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
      roleSpecificSettings={doctorSpecificSettings}
    />
  );
}
