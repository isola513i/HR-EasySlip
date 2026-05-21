// Apply-step (write to Employee, link payslip, etc.) is deferred to
// Phase 4 once Empeo's payload schema is finalized — for now we
// persist the envelope verbatim so it can be replayed.
import { Prisma, type PrismaClient } from "@prisma/client";
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

export async function recordInbound(prisma: PrismaClient, env: InboundEnvelope): Promise<InboundOutcome> {
  if (!env.eventType || !env.idempotencyKey) {
    return { ok: false, reason: "INVALID_PAYLOAD" };
  }

  try {
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
    }, prisma);

    logger.info("Empeo inbound event recorded", {
      eventId: event.id,
      eventType: env.eventType,
    });

    return { ok: true, eventId: event.id, deduped: false };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing = await prisma.empeoInboundEvent.findUnique({
        where: { idempotencyKey: env.idempotencyKey },
        select: { id: true },
      });
      if (existing) return { ok: true, eventId: existing.id, deduped: true };
    }
    throw err;
  }
}
