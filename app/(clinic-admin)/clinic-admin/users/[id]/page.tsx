import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PermissionsCheckboxPanel } from "@/components/permissions/PermissionsCheckboxPanel";
import { StaffStatusToggle } from "@/components/permissions/StaffStatusToggle";
import { EditStaffForm } from "./EditStaffForm";
import { ArrowLeft, Mail, Phone, ShieldCheck } from "lucide-react";

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: user } = await supabase
    .from("users")
    .select("id, full_name, email, role, phone, is_active, clinic_id, doctor_profiles(specialization, qualification, registration_no, consultation_fee)")
    .eq("id", id)
    .single();

  if (!user) notFound();

  type DocProfile = { specialization?: string | null; qualification?: string | null; registration_no?: string | null; consultation_fee?: number | null };
  const profile = (user as unknown as { doctor_profiles?: DocProfile | DocProfile[] | null }).doctor_profiles;
  const doctorProfile: DocProfile | undefined = Array.isArray(profile) ? profile[0] : profile ?? undefined;

  return (
    <div className="space-y-6">
      <Link href="/clinic-admin/users" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to staff
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{user.full_name}</h1>
          <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={user.is_active ? "success" : "secondary"}>{user.is_active ? "Active" : "Disabled"}</Badge>
          <StaffStatusToggle userId={user.id} isActive={!!user.is_active} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {user.email}</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {user.phone ?? "—"}</p>
          </CardContent>
        </Card>

        <EditStaffForm
          user={{ id: user.id, full_name: user.full_name, phone: user.phone, role: user.role }}
          doctorProfile={doctorProfile}
        />
      </div>

      {user.role === "doctor" && (
        <div className="grid gap-6 md:grid-cols-[1fr_auto]">
          <PermissionsCheckboxPanel userId={user.id} clinicId={user.clinic_id} />
          <Link href={`/clinic-admin/permissions/${user.id}`}>
            <Button variant="outline">
              <ShieldCheck className="mr-2 h-4 w-4" /> Full permissions page
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
