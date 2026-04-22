// ════════════════════════════════════════════════════════════════
// Cron Auth — verify shared secret for /_system/cron/* endpoints
// ════════════════════════════════════════════════════════════════

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

  if (!token || token !== secret) {
    return apiError("CRON_UNAUTHORIZED", "Invalid cron secret", 401);
  }

  return null; // OK
}
