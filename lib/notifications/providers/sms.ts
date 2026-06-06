import twilio from "twilio";

export async function sendSMS(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_SMS_FROM) {
    return { ok: false, error: "Twilio SMS not configured" };
  }
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  try {
    await client.messages.create({ from: process.env.TWILIO_SMS_FROM, to, body });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "SMS send failed" };
  }
}
