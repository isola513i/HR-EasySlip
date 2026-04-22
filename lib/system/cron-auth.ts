// ════════════════════════════════════════════════════════════════
// Cron Auth — verify shared secret for /system/cron/* endpoints
// Uses timing-safe comparison to prevent side-channel attacks
// ════════════════════════════════════════════════════════════════

import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { apiError } from "@/lib/api/response";

/**
 * Verify that the request has a valid cron secret.
 * Checks `Authorization: Bearer <CRON_SECRET>` header.
 * Returns error response if invalid, null if OK.
 */
export function verifyCronAuth(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[Cron] CRON_SECRET env var not set");
    return apiError("CRON_AUTH_ERROR", "Cron authentication not configured", 500);
  }

  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return apiError("CRON_UNAUTHORIZED", "Invalid cron secret", 401);
  }

  // Constant-time comparison to prevent timing attacks
  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(secret);
  if (tokenBuf.length !== secretBuf.length || !timingSafeEqual(tokenBuf, secretBuf)) {
    return apiError("CRON_UNAUTHORIZED", "Invalid cron secret", 401);
  }

  return null; // OK
}
