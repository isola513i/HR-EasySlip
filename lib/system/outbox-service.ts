// ════════════════════════════════════════════════════════════════
// Outbox Service — retry failed outbox events
// ════════════════════════════════════════════════════════════════

import { getPrisma } from "@/lib/prisma";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import { writeAuditLog } from "@/lib/audit/logger";

export async function retryEvent(eventId: string) {
  const prisma = await getPrisma();
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

const EXHAUSTED_THRESHOLD = 3;

/**
 * Check for FAILED outbox events that have exhausted retries.
 * Sends alert email to HR if any found.
 */
export async function alertOnExhaustedOutboxEvents(): Promise<void> {
  const prisma = await getPrisma();
  const events = await prisma.payrollOutboxEvent.findMany({
    where: { status: "FAILED", attempts: { gte: EXHAUSTED_THRESHOLD } },
    select: { id: true, eventType: true, lastError: true, attempts: true },
    take: 20,
  });

  if (events.length === 0) return;

  const { sendNotificationEmail } = await import("@/lib/email/notification-service");

  const lines = events.map(
    (e) => `• ${e.id} (${e.eventType}) — ${e.attempts} attempts — ${e.lastError ?? "unknown error"}`,
  );

  const subject = `[EasySlip HR] ⚠ ${events.length} outbox event(s) require manual attention`;
  const body = [
    "The following payroll outbox events have exhausted retries:",
    "",
    ...lines,
    "",
    "Please check the system and retry manually via POST /api/v1/system/outbox/retry/:eventId",
  ].join("\n");

  const alertEmail = process.env.ALERT_EMAIL ?? process.env.EMAIL_FROM ?? "development.v001@gmail.com";

  await sendNotificationEmail(
    alertEmail,
    subject,
    `<pre style="font-family:monospace;font-size:13px;">${body}</pre>`,
    body,
  );
}
