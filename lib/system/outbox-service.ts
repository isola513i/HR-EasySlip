// ════════════════════════════════════════════════════════════════
// Outbox Service — retry failed outbox events
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import { writeAuditLog } from "@/lib/audit/logger";

export async function retryEvent(eventId: string) {
  const event = await prisma.payrollOutboxEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
  if (event.status !== "FAILED") {
    throw new DomainError(ErrorCodes.INVALID_STATUS, { current: event.status });
  }

  const updated = await prisma.payrollOutboxEvent.update({
    where: { id: eventId },
    data: { status: "PENDING", attempts: { increment: 1 }, lastError: null },
  });

  await writeAuditLog({
    actorId: null,
    action: "outbox.retry",
    entityType: "PayrollOutboxEvent",
    entityId: eventId,
    before: event,
    after: updated,
  });

  return updated;
}
