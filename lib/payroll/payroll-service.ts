// ════════════════════════════════════════════════════════════════
// Payroll Service — cycle management
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { Caller, RequestMeta } from "@/lib/api/types";

export async function listCycles(year?: number, status?: string) {
  return prisma.payrollCycle.findMany({
    where: {
      ...(year && { year }),
      ...(status && { status: status as never }),
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

export async function markCycleExported(
  caller: Caller,
  cycleId: string,
  meta: RequestMeta,
) {
  return prisma.$transaction(async (tx) => {
    const cycle = await tx.payrollCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (cycle.status !== "LOCKED") {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED, { status: cycle.status });
    }

    const exported = await tx.payrollCycle.update({
      where: { id: cycleId },
      data: { status: "EXPORTED" },
    });

    await tx.payrollOutboxEvent.create({
      data: {
        payrollCycleId: cycleId,
        eventType: "cycle.exported",
        aggregateId: cycleId,
        payload: { cycleId, year: cycle.year, month: cycle.month },
        idempotencyKey: `cycle-exported:${cycleId}`,
        status: "PENDING",
      },
    });

    await writeAuditLog({
      actorId: caller.userId,
      action: "payroll.cycle_exported",
      entityType: "PayrollCycle",
      entityId: cycleId,
      before: cycle,
      after: exported,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return exported;
  });
}

export async function lockCycle(
  caller: Caller,
  cycleId: string,
  meta: RequestMeta,
) {
  const cycle = await prisma.payrollCycle.findUnique({
    where: { id: cycleId },
  });

  if (!cycle) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
  if (cycle.status !== "OPEN") {
    throw new DomainError(ErrorCodes.ALREADY_PROCESSED, { status: cycle.status });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const locked = await tx.payrollCycle.update({
      where: { id: cycleId },
      data: { status: "LOCKED", lockedAt: new Date(), lockedBy: caller.userId },
    });

    await tx.payrollOutboxEvent.create({
      data: {
        payrollCycleId: cycleId,
        eventType: "cycle.locked",
        aggregateId: cycleId,
        payload: { cycleId, year: cycle.year, month: cycle.month },
        idempotencyKey: `cycle-locked:${cycleId}`,
        status: "PENDING",
      },
    });

    await writeAuditLog({
      actorId: caller.userId,
      action: "payroll.cycle_locked",
      entityType: "PayrollCycle",
      entityId: cycleId,
      before: cycle,
      after: locked,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return locked;
  });

  return updated;
}
