import twilio from "twilio";

export async function sendWhatsApp(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_NUMBER) {
    return { ok: false, error: "Twilio WhatsApp not configured" };
  }
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
      body,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "WhatsApp send failed" };
  }
}
