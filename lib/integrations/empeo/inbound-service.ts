// ════════════════════════════════════════════════════════════════
// Empeo Inbound Service — accept signed webhook, store for replay.
// ----------------------------------------------------------------
// Per Phase 3 plan: persist verbatim only. Apply-step (e.g. update
// Employee salary fields, link payslip URL) lives in Phase 4 once
// Empeo's payload schema is finalized.
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { logger } from "@/lib/observability/logger";

export interface InboundEnvelope {
  eventType: string;
  externalId?: string;
  idempotencyKey: string;
  payload: unknown;
}

export type InboundOutcome =
  | { ok: true; eventId: string; deduped: boolean }
  | { ok: false; reason: "INVALID_PAYLOAD" };

export async function recordInbound(env: InboundEnvelope): Promise<InboundOutcome> {
  if (!env.eventType || !env.idempotencyKey) {
    return { ok: false, reason: "INVALID_PAYLOAD" };
  }

  const existing = await prisma.empeoInboundEvent.findUnique({
    where: { idempotencyKey: env.idempotencyKey },
    select: { id: true },
  });
  if (existing) {
    return { ok: true, eventId: existing.id, deduped: true };
  }

  const event = await prisma.empeoInboundEvent.create({
    data: {
      eventType: env.eventType,
      externalId: env.externalId ?? null,
      idempotencyKey: env.idempotencyKey,
      payload: env.payload as never,
      status: "RECEIVED",
    },
  });

  await writeAuditLog({
    actorId: null,
    action: "empeo.inbound_received",
    entityType: "EmpeoInboundEvent",
    entityId: event.id,
    after: { eventType: env.eventType, externalId: env.externalId ?? null },
  });

  logger.info("Empeo inbound event recorded", {
    eventId: event.id,
    eventType: env.eventType,
  });

  return { ok: true, eventId: event.id, deduped: false };
}
