// ════════════════════════════════════════════════════════════════
// Web Push — server-side helper for sending notifications
// ────────────────────────────────────────────────────────────────
// Requires VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY in env. Generate once
// with `bunx web-push generate-vapid-keys` and store in Vercel env.
// ════════════════════════════════════════════════════════════════

import webpush from "web-push";
import { getPrisma } from "@/lib/prisma";
import { logger } from "@/lib/observability/logger";

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hr@easyslip.local";
  if (!publicKey || !privateKey) {
    logger.warn("Push notifications disabled — missing VAPID keys");
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/** Sends a push to all subscriptions belonging to the given user. Stale subs
 * (404/410 from the push endpoint) are pruned automatically. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;
  const prisma = await getPrisma();
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
      await prisma.pushSubscription.update({
        where: { id: s.id },
        data: { lastUsed: new Date() },
      });
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 404 || status === 410) {
        await prisma.pushSubscription.delete({ where: { id: s.id } });
      } else {
        logger.warn("Push send failed", { userId, status });
      }
    }
  }));
}
