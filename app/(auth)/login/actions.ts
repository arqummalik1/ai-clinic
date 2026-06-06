"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_ROUTE_MAP } from "@/lib/supabase/middleware";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Email and password are required" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: error?.message ?? "Invalid credentials" };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const dest = profile?.role ? ROLE_ROUTE_MAP[profile.role] : "/";
  redirect(`${dest}/dashboard`);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

