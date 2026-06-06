"use server";

import { createClient } from "@/lib/supabase/server";

export type ForgotState = { error?: string; success?: boolean };

export async function forgotAction(_prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Email is required" };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: error.message };
  return { success: true };
}
