"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export type CreateStaffState = { error?: string; success?: boolean };

type AdminAuthClient = {
  admin: {
    createUser: (args: { email: string; password: string; email_confirm: boolean }) => Promise<{
      data: { user: { id: string } | null };
      error: { message: string } | null;
    }>;
    deleteUser: (id: string) => Promise<unknown>;
  };
};

async function ensureClinicAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const };
  const { data: caller } = await supabase
    .from("users")
    .select("role, clinic_id")
    .eq("id", user.id)
    .single();
  if (caller?.role !== "clinic_admin" || !caller.clinic_id) return { error: "Forbidden" as const };
  return { clinicId: caller.clinic_id, callerId: user.id };
}

export async function createStaff(_prev: CreateStaffState, formData: FormData): Promise<CreateStaffState> {
  const ctx = await ensureClinicAdmin();
  if ("error" in ctx) return { error: ctx.error };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "") as "doctor" | "receptionist";
  const specialization = String(formData.get("specialization") ?? "").trim() || null;
  const qualification = String(formData.get("qualification") ?? "").trim() || null;
  const consultationFeeRaw = String(formData.get("consultationFee") ?? "").trim();
  const registrationNo = String(formData.get("registrationNo") ?? "").trim() || null;

  if (!fullName || !email || !password || !role) return { error: "Missing required fields" };
  if (password.length < 8) return { error: "Password must be at least 8 characters" };
  if (role !== "doctor" && role !== "receptionist") return { error: "Invalid role" };

  const admin = createServiceRoleClient();
  const auth = (admin.auth as unknown as AdminAuthClient).admin;

  const { data: authUser, error: authError } = await auth.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError || !authUser.user) return { error: authError?.message ?? "Auth error" };

  const { error: userError } = await admin.from("users").insert({
    id: authUser.user.id,
    clinic_id: ctx.clinicId,
    role,
    full_name: fullName,
    email,
    phone,
  });
  if (userError) {
    await auth.deleteUser(authUser.user.id);
    return { error: userError.message };
  }

  if (role === "doctor") {
    await admin.from("doctor_profiles").insert({
      user_id: authUser.user.id,
      clinic_id: ctx.clinicId,
      specialization,
      qualification,
      registration_no: registrationNo,
      consultation_fee: consultationFeeRaw ? Number(consultationFeeRaw) : 0,
    });
  }

  revalidatePath("/clinic-admin/users");
  redirect("/clinic-admin/users");
}

export async function toggleStaffActive(userId: string, nextActive: boolean) {
  const ctx = await ensureClinicAdmin();
  if ("error" in ctx) return { error: ctx.error };
  const admin = createServiceRoleClient();
  await admin.from("users").update({ is_active: nextActive }).eq("id", userId).eq("clinic_id", ctx.clinicId);
  revalidatePath("/clinic-admin/users");
  return { success: true };
}

export type UpdateStaffState = { error?: string; success?: boolean };

/**
 * Update an existing staff member's profile. Clinic-admin only, and the target
 * user must belong to the caller's clinic (enforced by the `.eq("clinic_id")`).
 */
export async function updateStaff(
  userId: string,
  _prev: UpdateStaffState,
  formData: FormData,
): Promise<UpdateStaffState> {
  const ctx = await ensureClinicAdmin();
  if ("error" in ctx) return { error: ctx.error };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  if (!fullName) return { error: "Full name is required" };

  const admin = createServiceRoleClient();

  // Confirm the target user is in the caller's clinic before mutating.
  const { data: target } = await admin
    .from("users")
    .select("id, role, clinic_id")
    .eq("id", userId)
    .eq("clinic_id", ctx.clinicId)
    .single();
  if (!target) return { error: "Staff member not found in your clinic" };

  const { error: userError } = await admin
    .from("users")
    .update({ full_name: fullName, phone })
    .eq("id", userId)
    .eq("clinic_id", ctx.clinicId);
  if (userError) return { error: userError.message };

  if (target.role === "doctor") {
    const specialization = String(formData.get("specialization") ?? "").trim() || null;
    const qualification = String(formData.get("qualification") ?? "").trim() || null;
    const registrationNo = String(formData.get("registrationNo") ?? "").trim() || null;
    const consultationFeeRaw = String(formData.get("consultationFee") ?? "").trim();

    const { error: profileError } = await admin
      .from("doctor_profiles")
      .upsert(
        {
          user_id: userId,
          clinic_id: ctx.clinicId,
          specialization,
          qualification,
          registration_no: registrationNo,
          consultation_fee: consultationFeeRaw ? Number(consultationFeeRaw) : 0,
        },
        { onConflict: "user_id" },
      );
    if (profileError) return { error: profileError.message };
  }

  revalidatePath(`/clinic-admin/users/${userId}`);
  revalidatePath("/clinic-admin/users");
  return { success: true };
}
