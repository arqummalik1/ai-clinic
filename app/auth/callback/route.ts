import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ROLE_ROUTE_MAP } from "@/lib/supabase/middleware";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) return NextResponse.redirect(`${origin}/login`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/login?error=auth`);

  // If the link targeted a specific destination (e.g. the password reset page),
  // honor it instead of bouncing straight to the role dashboard.
  if (next && next.startsWith("/")) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const dest = profile?.role ? ROLE_ROUTE_MAP[profile.role] : "/";
  return NextResponse.redirect(`${origin}${dest}/dashboard`);
}
