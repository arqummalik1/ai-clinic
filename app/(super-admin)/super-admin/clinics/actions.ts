"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export type CreateClinicState = { error?: string; success?: boolean };

export async function createClinicWithAdmin(
  _prev: CreateClinicState,
  formData: FormData,
): Promise<CreateClinicState> {
  const clinicName = String(formData.get("clinicName") ?? "").trim();
  const adminName = String(formData.get("adminName") ?? "").trim();
  const adminEmail = String(formData.get("adminEmail") ?? "").trim();
  const adminPassword = String(formData.get("adminPassword") ?? "");

  if (!clinicName || !adminName || !adminEmail || !adminPassword) {
    return { error: "All fields are required" };
  }
  if (adminPassword.length < 8) return { error: "Password must be at least 8 characters" };

  // Verify caller is super_admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { data: caller } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (caller?.role !== "super_admin") return { error: "Forbidden" };

  // Use service role to create clinic + auth user + users row atomically
  const admin = createServiceRoleClient();

  const { data: clinic, error: clinicError } = await admin
    .from("clinics")
    .insert({ name: clinicName })
    .select()
    .single();
  if (clinicError || !clinic) return { error: clinicError?.message ?? "Could not create clinic" };

  const { data: authUser, error: authError } = await (admin.auth as unknown as {
    admin: {
      createUser: (args: { email: string; password: string; email_confirm: boolean }) => Promise<{
        data: { user: { id: string } | null }; error: { message: string } | null;
      }>;
    };
  }).admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    await admin.from("clinics").delete().eq("id", clinic.id);
    return { error: authError?.message ?? "Could not create admin user" };
  }

  const { error: userError } = await admin.from("users").insert({
    id: authUser.user.id,
    clinic_id: clinic.id,
    role: "clinic_admin",
    full_name: adminName,
    email: adminEmail,
  });
  if (userError) return { error: userError.message };

  revalidatePath("/super-admin/clinics");
  return { success: true };
}

/**
 * Enable or disable a clinic. Only a super_admin may call this.
 * Disabling a clinic flips `is_active` to false (soft-disable, no data loss).
 */
export async function toggleClinicActive(
  clinicId: string,
  nextActive: boolean,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: caller } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (caller?.role !== "super_admin") return { error: "Forbidden" };

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("clinics")
    .update({ is_active: nextActive })
    .eq("id", clinicId);
  if (error) return { error: error.message };

  revalidatePath("/super-admin/clinics");
  revalidatePath(`/super-admin/clinics/${clinicId}`);
  return { success: true };
}
