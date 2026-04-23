import { prisma } from "@/lib/prisma";
import type { PayrollOutboxEvent } from "@prisma/client";

export async function findPendingExportEvent(
  cycleId: string,
  eventType: string,
): Promise<PayrollOutboxEvent | null> {
  return prisma.payrollOutboxEvent.findFirst({
    where: { payrollCycleId: cycleId, eventType, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

export async function markOutboxConsumed(eventId: string): Promise<void> {
  await prisma.payrollOutboxEvent.update({
    where: { id: eventId },
    data: { status: "CONSUMED", consumedAt: new Date() },
  });
}

export async function markOutboxFailed(eventId: string, error: string): Promise<void> {
  await prisma.payrollOutboxEvent.update({
    where: { id: eventId },
    data: { status: "FAILED", lastError: error, attempts: { increment: 1 } },
  });
}
