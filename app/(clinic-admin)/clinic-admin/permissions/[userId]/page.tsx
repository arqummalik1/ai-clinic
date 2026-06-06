import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PermissionsCheckboxPanel } from "@/components/permissions/PermissionsCheckboxPanel";
import { ArrowLeft } from "lucide-react";

export default async function ManagePermissionsPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, full_name, role, clinic_id")
    .eq("id", userId)
    .single();

  if (!user || user.role !== "doctor") notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/clinic-admin/permissions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Permissions for {user.full_name}</h1>
        <p className="text-sm text-muted-foreground">Toggle what this doctor can see and do.</p>
      </div>
      <PermissionsCheckboxPanel userId={user.id} clinicId={user.clinic_id} />
    </div>
  );
}
