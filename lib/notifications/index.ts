export type NotificationChannel = "whatsapp" | "sms" | "email";

export interface NotificationPayload {
  to: string;
  subject?: string;
  body: string;
  channel: NotificationChannel;
  attachments?: { filename: string; content: Buffer | string; contentType?: string }[];
}

export async function sendNotification(payload: NotificationPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    switch (payload.channel) {
      case "whatsapp": {
        const { sendWhatsApp } = await import("./providers/whatsapp");
        return sendWhatsApp(payload.to, payload.body);
      }
      case "sms": {
        const { sendSMS } = await import("./providers/sms");
        return sendSMS(payload.to, payload.body);
      }
      case "email": {
        const { sendEmail } = await import("./providers/email");
        return sendEmail(payload.to, payload.subject ?? "Notification", payload.body, payload.attachments);
      }
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
  }
}

export function pickChannel(patient: { email?: string | null; phone?: string | null }): NotificationChannel | null {
  if (patient.email) return "email";
  if (patient.phone) return "whatsapp";
  return null;
}
