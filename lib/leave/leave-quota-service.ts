// ════════════════════════════════════════════════════════════════
// Leave Quota Service — queries + manual adjustment
// Grant/reset functions are in leave-quota-grant-service.ts
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { Caller, RequestMeta } from "@/lib/api/types";

export async function getMyQuota(employeeId: string, year?: number) {
  const quotaYear = year ?? new Date().getFullYear();

  const quotas = await prisma.leaveQuota.findMany({
    where: { employeeId, quotaYear },
    orderBy: { leaveType: "asc" },
  });

  return quotas.map((q) => ({
    ...q,
    available: q.allocatedDays.minus(q.usedDays).minus(q.pendingDays).toNumber(),
  }));
}

export async function getEmployeeQuota(employeeId: string, year?: number) {
  const exists = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true },
  });
  if (!exists) throw new DomainError(ErrorCodes.EMPLOYEE_NOT_FOUND, {}, 404);

  return getMyQuota(employeeId, year);
}

export async function adjustQuota(
  caller: Caller,
  input: { employeeId: string; leaveType: string; quotaYear: number; adjustDays: number; reason: string },
  meta: RequestMeta,
) {
  const quota = await prisma.leaveQuota.findFirst({
    where: {
      employeeId: input.employeeId,
      leaveType: input.leaveType as never,
      quotaYear: input.quotaYear,
    },
  });

  if (!quota) throw new DomainError(ErrorCodes.NO_QUOTA_RECORD, {}, 404);

  const before = { ...quota };
  const updated = await prisma.leaveQuota.update({
    where: { id: quota.id },
    data: {
      allocatedDays: { increment: input.adjustDays },
      prorateBasis: "manual-adjust",
    },
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "leave.quota_adjust",
    entityType: "LeaveQuota",
    entityId: quota.id,
    before,
    after: updated,
    reason: input.reason,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
}
