"use server";

import { createClient } from "@/lib/supabase/server";

export type ResetState = { error?: string; success?: boolean };

export async function resetPasswordAction(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const supabase = await createClient();

  // The user must have an active recovery session (set by /auth/callback after
  // clicking the email link). Without it, updateUser will fail.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your reset link has expired. Please request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { success: true };
}
