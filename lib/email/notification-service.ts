import { Resend } from "resend";
import { resendCircuit } from "./circuit-breaker";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "EasySlip HR <onboarding@resend.dev>";

const RETRY_DELAYS_MS = [0, 1_000, 3_000];
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function isRetryable(error: { statusCode?: number; message?: string }): boolean {
  const code = error.statusCode ?? 0;
  return code === 429 || code >= 500;
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<boolean> {
  if (resendCircuit.isOpen()) {
    console.warn("[Notification] Circuit OPEN — skipping email send");
    return false;
  }

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    if (RETRY_DELAYS_MS[attempt] > 0) await sleep(RETRY_DELAYS_MS[attempt]);

    try {
      const { error } = await resend.emails.send({ from: FROM, to, subject, html, text });

      if (!error) {
        resendCircuit.onSuccess();
        return true;
      }

      if (!isRetryable(error as { statusCode?: number })) {
        console.error("[Notification] Non-retryable error:", error);
        break;
      }
      console.warn(`[Notification] Attempt ${attempt + 1} failed:`, error);
    } catch (err) {
      console.warn(`[Notification] Attempt ${attempt + 1} threw:`, err);
    }
  }

  console.error("[Notification] All attempts failed — email not delivered");
  resendCircuit.onFailure();
  return false;
}
