// ════════════════════════════════════════════════════════════════
// Empeo Client — outbound HTTP sender for outbox events.
// ----------------------------------------------------------------
// Phase 3 skeleton: signs payload with HMAC-SHA256 and POSTs to the
// configured Empeo webhook URL. Retries are handled by the outbox
// processor via attempts counter — this module only does I/O.
//
// NOTE: Empeo API spec is not finalized. The wire format below is
// our internal envelope; map onto Empeo's schema once published.
// ════════════════════════════════════════════════════════════════

import { createHmac, timingSafeEqual } from "crypto";

export interface EmpeoEnvelope {
  eventType: string;
  aggregateId: string;
  idempotencyKey: string;
  payload: unknown;
  emittedAt: string;
}

export interface EmpeoSendResult {
  ok: boolean;
  status: number;
  body: string;
}

/** Returns true when both webhook URL and secret are set. */
export function isEmpeoEnabled(): boolean {
  return Boolean(process.env.EMPEO_WEBHOOK_URL && process.env.EMPEO_WEBHOOK_SECRET);
}

export function signPayload(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

/** Constant-time comparison for inbound signature verification. */
export function verifySignature(rawBody: string, headerSig: string | null, secret: string): boolean {
  if (!headerSig) return false;
  const expected = signPayload(rawBody, secret);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(headerSig, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function sendEnvelope(envelope: EmpeoEnvelope): Promise<EmpeoSendResult> {
  const url = process.env.EMPEO_WEBHOOK_URL;
  const secret = process.env.EMPEO_WEBHOOK_SECRET;
  if (!url || !secret) {
    return { ok: false, status: 0, body: "EMPEO_NOT_CONFIGURED" };
  }

  const body = JSON.stringify(envelope);
  const signature = signPayload(body, secret);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-EasySlip-Signature": signature,
      "X-Idempotency-Key": envelope.idempotencyKey,
    },
    body,
    // Empeo SLA is unknown; cap at 10s so cron doesn't stall.
    signal: AbortSignal.timeout(10_000),
  });

  const text = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, body: text.slice(0, 2000) };
}
