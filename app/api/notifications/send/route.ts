import { NextRequest, NextResponse } from "next/server";
import { sendNotification, type NotificationChannel } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to, subject, body, channel, recipientType, recipientId } = await req.json();
  if (!to || !body || !channel) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { data: profile } = await supabase.from("users").select("clinic_id").eq("id", user.id).single();
  const result = await sendNotification({ to, subject, body, channel: channel as NotificationChannel });

  if (profile?.clinic_id) {
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
  }

  return NextResponse.json(result);
}
