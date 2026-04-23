import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "EasySlip HR <onboarding@resend.dev>";

export async function sendNotificationEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[Notification] Resend error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Notification] Failed to send:", err);
    return false;
  }
}
