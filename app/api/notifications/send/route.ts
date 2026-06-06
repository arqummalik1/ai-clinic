import { NextRequest, NextResponse } from "next/server";
import { sendNotification, type NotificationChannel } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";

export const runtime = "nodejs";

const VALID_CHANNELS: NotificationChannel[] = ["email", "whatsapp", "sms"];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 30 manual sends/min per user.
  const rl = checkRateLimit(`notifications:send:${user.id}`, 30, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl);

  const { to, subject, body, channel, recipientType, recipientId } = await req.json();
  if (!to || !body || !channel) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!VALID_CHANNELS.includes(channel)) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }

  // The caller must belong to a clinic to send notifications through this route.
  const { data: profile } = await supabase
    .from("users")
    .select("clinic_id")
    .eq("id", user.id)
    .single();
  if (!profile?.clinic_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Tenant isolation: if a patient recipient is specified, it MUST belong to the
  // caller's clinic. Prevents sending to (and logging against) another clinic's
  // patient.
  if (recipientId && (recipientType ?? "patient") === "patient") {
    const { data: patient } = await supabase
      .from("patients")
      .select("clinic_id")
      .eq("id", recipientId)
      .single();
    if (!patient || patient.clinic_id !== profile.clinic_id) {
      return NextResponse.json({ error: "Forbidden — recipient is not in your clinic" }, { status: 403 });
    }
  }

  const result = await sendNotification({ to, subject, body, channel: channel as NotificationChannel });

  await supabase.from("notifications").insert({
    clinic_id: profile.clinic_id,
    recipient_type: recipientType ?? "patient",
    recipient_id: recipientId ?? null,
    channel,
    subject: subject ?? null,
    body,
    status: result.ok ? "sent" : "failed",
    sent_at: result.ok ? new Date().toISOString() : null,
    metadata: result.error ? { error: result.error } : {},
  });

  return NextResponse.json(result);
}
