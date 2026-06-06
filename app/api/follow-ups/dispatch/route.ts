import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendNotification, pickChannel, type NotificationChannel } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Accept either our custom header (manual/external cron) or Vercel Cron's
  // auto-injected `Authorization: Bearer <CRON_SECRET>` header.
  const cronSecret = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;
  const isCronAuthorized =
    !!process.env.CRON_SECRET &&
    (cronSecret === process.env.CRON_SECRET ||
      bearerSecret === process.env.CRON_SECRET);

  let onlyId: string | undefined;
  try {
    const body = await req.json();
    onlyId = body?.followUpId;
  } catch { /* no body */ }

  if (!isCronAuthorized && !onlyId) {
    return NextResponse.json({ error: "Unauthorized — missing CRON_SECRET or followUpId" }, { status: 401 });
  }

  const admin = createServiceRoleClient();
  const nowIso = new Date().toISOString();

  let q = admin
    .from("follow_ups")
    .select("id, clinic_id, patient_id, doctor_id, follow_up_date, notification_channel, custom_message, patients(full_name, email, phone), users!doctor_id(full_name)")
    .eq("notified", false);

  if (onlyId) q = q.eq("id", onlyId);
  else q = q.lte("scheduled_send_at", nowIso);

  const { data: rows, error } = await q.limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  let failed = 0;
  const details: { id: string; ok: boolean; error?: string }[] = [];

  for (const r of rows ?? []) {
    const patient = (r as { patients?: { full_name?: string; email?: string | null; phone?: string | null } | { full_name?: string; email?: string | null; phone?: string | null }[] }).patients;
    const p = Array.isArray(patient) ? patient[0] : patient;
    const docRaw = (r as { users?: { full_name?: string } | { full_name?: string }[] }).users;
    const doc = Array.isArray(docRaw) ? docRaw[0] : docRaw;

    const channel = (r.notification_channel as NotificationChannel | null) ?? pickChannel({ email: p?.email, phone: p?.phone });
    if (!channel) {
      failed++;
      details.push({ id: r.id, ok: false, error: "No contact method" });
      continue;
    }

    const to = channel === "email" ? p?.email : p?.phone;
    if (!to) {
      failed++;
      details.push({ id: r.id, ok: false, error: "Missing address" });
      continue;
    }

    const body =
      r.custom_message ??
      `Hello ${p?.full_name ?? ""}, this is a reminder from Dr. ${doc?.full_name ?? "your doctor"}: please book your follow-up appointment scheduled for ${r.follow_up_date}.`;

    const result = await sendNotification({
      channel,
      to,
      subject: "Follow-up reminder",
      body,
    });

    if (result.ok) {
      await admin
        .from("follow_ups")
        .update({ notified: true, reminder_sent_at: new Date().toISOString() })
        .eq("id", r.id);
      await admin.from("notifications").insert({
        clinic_id: r.clinic_id,
        recipient_type: "patient",
        recipient_id: r.patient_id,
        type: "follow_up_reminder",
        channel,
        subject: "Follow-up reminder",
        body,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
      sent++;
      details.push({ id: r.id, ok: true });
    } else {
      await admin.from("notifications").insert({
        clinic_id: r.clinic_id,
        recipient_type: "patient",
        recipient_id: r.patient_id,
        type: "follow_up_reminder",
        channel,
        subject: "Follow-up reminder",
        body,
        status: "failed",
        metadata: result.error ? { error: result.error } : {},
      });
      failed++;
      details.push({ id: r.id, ok: false, error: result.error });
    }
  }

  return NextResponse.json({ checked: rows?.length ?? 0, sent, failed, details });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
