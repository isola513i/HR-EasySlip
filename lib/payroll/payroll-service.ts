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

  const updated = await prisma.payrollCycle.update({
    where: { id: cycleId },
    data: { status: "LOCKED", lockedAt: new Date(), lockedBy: caller.userId },
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "payroll.cycle_locked",
    entityType: "PayrollCycle",
    entityId: cycleId,
    before: cycle,
    after: updated,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
}
