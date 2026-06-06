import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * One-stop health check for the demo. Returns only booleans + ids — no secret
 * values. Useful for confirming env keys are loaded and the `prescriptions`
 * storage bucket exists.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, clinic_id")
    .eq("id", user.id)
    .single();

  // Check `next_token_number` RPC
  let rpcTokenOk = false;
  let rpcTokenError: string | undefined;
  if (profile?.clinic_id) {
    const today = new Date().toISOString().split("T")[0];
    const resp = await supabase.rpc("next_token_number", {
      p_clinic_id: profile.clinic_id,
      p_date: today,
    });
    rpcTokenOk = !resp.error;
    rpcTokenError = resp.error?.message;
  }

  // Probe the `prescriptions` storage bucket. Anything that reads as
  // "not found" / contains "bucket" tells us the bucket is missing.
  const bucketProbe = await supabase.storage.from("prescriptions").list("", { limit: 1 });
  const bucketMsg = bucketProbe.error?.message?.toLowerCase() ?? "";
  const bucketPresent =
    !bucketProbe.error || (!bucketMsg.includes("not found") && !bucketMsg.includes("bucket"));

  return NextResponse.json({
    auth: {
      user: user.id,
      role: profile?.role ?? null,
      clinicId: profile?.clinic_id ?? null,
    },
    env: {
      groq: !!process.env.GROQ_API_KEY,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      resend: !!process.env.RESEND_API_KEY,
      twilio:
        !!process.env.TWILIO_ACCOUNT_SID &&
        !!process.env.TWILIO_AUTH_TOKEN &&
        !!process.env.TWILIO_WHATSAPP_NUMBER,
    },
    supabase: {
      rpcTokenOk,
      rpcTokenError,
      bucketPrescriptions: bucketPresent,
      bucketError: bucketProbe.error?.message,
    },
  });
}
