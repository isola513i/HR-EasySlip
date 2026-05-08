// ════════════════════════════════════════════════════════════════
// POST /api/v1/integrations/empeo/webhook
// ----------------------------------------------------------------
// HMAC-signed inbound from Empeo. Stores envelope verbatim; the
// "apply" step (write to Employee, link payslip, etc.) is deferred
// to Phase 4 once Empeo's payload schema is finalized.
// ════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { apiOk, apiError } from "@/lib/api/response";
import { logger } from "@/lib/observability/logger";
import { verifySignature } from "@/lib/integrations/empeo/empeo-client";
import { recordInbound } from "@/lib/integrations/empeo/inbound-service";

const SIGNATURE_HEADER = "x-empeo-signature";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.EMPEO_WEBHOOK_SECRET;
  if (!secret) {
    return apiError("EMPEO_NOT_CONFIGURED", "Empeo integration is disabled", 503);
  }

  const rawBody = await req.text();
  const signature = req.headers.get(SIGNATURE_HEADER);
  if (!verifySignature(rawBody, signature, secret)) {
    logger.warn("Empeo webhook signature mismatch", {
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
    });
    return apiError("EMPEO_BAD_SIGNATURE", "Invalid signature", 401);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return apiError("EMPEO_BAD_PAYLOAD", "Body is not valid JSON", 400);
  }

  const env = parsed as {
    eventType?: string;
    externalId?: string;
    idempotencyKey?: string;
    payload?: unknown;
  };
  if (!env.eventType || !env.idempotencyKey) {
    return apiError("EMPEO_BAD_PAYLOAD", "Missing eventType or idempotencyKey", 400);
  }

  const result = await recordInbound({
    eventType: env.eventType,
    externalId: env.externalId,
    idempotencyKey: env.idempotencyKey,
    payload: env.payload ?? null,
  });

  if (!result.ok) {
    return apiError("EMPEO_BAD_PAYLOAD", "Invalid envelope", 400);
  }

  return apiOk({ eventId: result.eventId, deduped: result.deduped });
}
