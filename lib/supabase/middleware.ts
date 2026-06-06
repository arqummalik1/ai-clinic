import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export const ROLE_ROUTE_MAP: Record<string, string> = {
  super_admin: "/super-admin",
  clinic_admin: "/clinic-admin",
  doctor: "/doctor",
  receptionist: "/reception",
};

const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/auth/callback"];

/**
 * Copy any Set-Cookie writes that Supabase queued onto the "next" response
 * into a redirect response. Without this, the auth session cookie produced by
 * `supabase.auth.getUser()` gets dropped whenever we redirect (role routing,
 * unauth bounce, etc.), which is exactly what caused /api/ai/transcribe to
 * see no user and return 401.
 */
function carryCookies(
  source: NextResponse,
  target: NextResponse,
): NextResponse {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
  return target;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => (p === "/" ? pathname === "/" : pathname.startsWith(p)));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return carryCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    const allowedPrefix = role ? ROLE_ROUTE_MAP[role] : undefined;

    // Logged-in users hitting a public auth page → bounce to their dashboard.
    // Exception: /auth/callback (mid-exchange) and /reset-password (the user
    // holds a recovery session and must be allowed to set a new password).
    if (
      isPublic &&
      allowedPrefix &&
      pathname !== "/auth/callback" &&
      !pathname.startsWith("/reset-password")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `${allowedPrefix}/dashboard`;
      return carryCookies(supabaseResponse, NextResponse.redirect(url));
    }

    // Root → role dashboard
    if (pathname === "/" && allowedPrefix) {
      const url = request.nextUrl.clone();
      url.pathname = `${allowedPrefix}/dashboard`;
      return carryCookies(supabaseResponse, NextResponse.redirect(url));
    }

    // Cross-role access → bounce to own dashboard
    if (
      allowedPrefix &&
      !pathname.startsWith(allowedPrefix) &&
      !pathname.startsWith("/api") &&
      !isPublic
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `${allowedPrefix}/dashboard`;
      return carryCookies(supabaseResponse, NextResponse.redirect(url));
    }
  }

  return supabaseResponse;
}
