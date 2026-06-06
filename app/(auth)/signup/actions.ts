"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";

export type SignupState = { error?: string };

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const clinicName = String(formData.get("clinicName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!fullName || !clinicName || !email || !password) {
    return { error: "All fields are required" };
  }
  if (password.length < 8) return { error: "Password must be at least 8 characters" };
  if (password !== confirmPassword) return { error: "Passwords do not match" };
  if (!email.includes("@")) return { error: "Please enter a valid email" };

  const admin = createServiceRoleClient();

  // 1. Create clinic
  const { data: clinic, error: clinicError } = await admin
    .from("clinics")
    .insert({ name: clinicName })
    .select()
    .single();
  if (clinicError || !clinic) {
    return { error: clinicError?.message ?? "Could not create clinic" };
  }

  // 2. Create auth user (auto-confirm email)
  const { data: authUser, error: authError } = await (admin.auth as unknown as {
    admin: {
      createUser: (args: { email: string; password: string; email_confirm: boolean }) => Promise<{
        data: { user: { id: string } | null }; error: { message: string } | null;
      }>;
    };
  }).admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    // Rollback clinic
    await admin.from("clinics").delete().eq("id", clinic.id);
    return { error: authError?.message ?? "Could not create account" };
  }

  // 3. Create users row as clinic_admin
  const { error: userError } = await admin.from("users").insert({
    id: authUser.user.id,
    clinic_id: clinic.id,
    role: "clinic_admin",
    full_name: fullName,
    email,
  });

  if (userError) {
    // Rollback
    await (admin.auth as unknown as { admin: { deleteUserById: (id: string) => Promise<{ error: { message: string } | null }> } })
      .admin.deleteUserById(authUser.user.id);
    await admin.from("clinics").delete().eq("id", clinic.id);
    return { error: userError.message };
  }

  // 4. Sign in the user so they land on dashboard immediately
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    // Account created but sign-in failed — redirect to login
    redirect("/login?signup=success");
  }

  redirect("/clinic-admin/dashboard");
}
