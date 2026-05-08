// ════════════════════════════════════════════════════════════════
// Empeo Dispatcher — drains PENDING + FAILED outbox events to Empeo.
// ----------------------------------------------------------------
// Called by the daily cron (system/cron/empeo-dispatch). When Empeo
// integration is disabled (no env vars), this no-ops cleanly so the
// system keeps working in CSV-only mode.
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { logger } from "@/lib/observability/logger";
import { isEmpeoEnabled, sendEnvelope } from "./empeo-client";

const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 5;

export interface DispatchResult {
  enabled: boolean;
  processed: number;
  consumed: number;
  failed: number;
  skipped: number;
}

export async function dispatchToEmpeo(): Promise<DispatchResult> {
  if (!isEmpeoEnabled()) {
    return { enabled: false, processed: 0, consumed: 0, failed: 0, skipped: 0 };
  }

  const events = await prisma.payrollOutboxEvent.findMany({
    where: {
      OR: [
        { status: "PENDING" },
        { status: "FAILED", attempts: { lt: MAX_ATTEMPTS } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  let consumed = 0;
  let failed = 0;
  let skipped = 0;

  for (const evt of events) {
    if (evt.attempts >= MAX_ATTEMPTS) {
      skipped++;
      continue;
    }

    try {
      const result = await sendEnvelope({
        eventType: evt.eventType,
        aggregateId: evt.aggregateId,
        idempotencyKey: evt.idempotencyKey,
        payload: evt.payload,
        emittedAt: evt.createdAt.toISOString(),
      });

      if (result.ok) {
        await prisma.payrollOutboxEvent.update({
          where: { id: evt.id },
          data: { status: "CONSUMED", consumedAt: new Date(), lastError: null },
        });
        consumed++;
      } else {
        await prisma.payrollOutboxEvent.update({
          where: { id: evt.id },
          data: {
            status: "FAILED",
            attempts: { increment: 1 },
            lastError: `HTTP ${result.status}: ${result.body}`,
          },
        });
        failed++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error";
      logger.error("Empeo dispatch error", { eventId: evt.id, error: msg });
      await prisma.payrollOutboxEvent.update({
        where: { id: evt.id },
        data: {
          status: "FAILED",
          attempts: { increment: 1 },
          lastError: msg.slice(0, 500),
        },
      });
      failed++;
    }
  }

  if (consumed > 0 || failed > 0) {
    await writeAuditLog({
      actorId: null,
      action: "empeo.dispatch_run",
      entityType: "PayrollOutboxEvent",
      entityId: `batch-${new Date().toISOString()}`,
      after: { consumed, failed, skipped, batchSize: events.length },
    });
  }

  return { enabled: true, processed: events.length, consumed, failed, skipped };
}
