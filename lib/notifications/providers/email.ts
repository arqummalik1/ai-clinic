import { Resend } from "resend";

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  attachments?: { filename: string; content: Buffer | string; contentType?: string }[],
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: "Resend not configured" };
  const from = process.env.RESEND_FROM_EMAIL ?? "MediSync <noreply@medisync.app>";
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const html = body.startsWith("<") ? body : `<p>${body.replace(/\n/g, "<br/>")}</p>`;
    await resend.emails.send({
      from,
      to,
      subject,
      html,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: typeof a.content === "string" ? a.content : a.content.toString("base64"),
      })),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Email send failed" };
  }
}
