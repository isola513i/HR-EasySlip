// ════════════════════════════════════════════════════════════════
// Leave Quota Service — get quota, reset, grant, adjust
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import { computeAnnualLeaveGrant } from "./annual-quota-engine";
import type { Role } from "@prisma/client";

interface Caller {
  userId: string;
  employeeId: string;
  roles: Role[];
}

interface RequestMeta {
  ip: string;
  userAgent: string;
}

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

export async function resetYearEnd(year: number) {
  // Find all ANNUAL quotas for the year with unused days
  const quotas = await prisma.leaveQuota.findMany({
    where: {
      leaveType: "ANNUAL",
      quotaYear: year,
    },
    include: { employee: { select: { id: true } } },
  });

  const cashOuts = [];
  for (const q of quotas) {
    const unused = q.allocatedDays.minus(q.usedDays);
    if (unused.gt(0)) {
      const cashOut = await prisma.annualLeaveCashOut.upsert({
        where: {
          employeeId_year: { employeeId: q.employeeId, year },
        },
        create: {
          employeeId: q.employeeId,
          year,
          unusedDays: unused,
          trigger: "YEAR_END",
        },
        update: { unusedDays: unused },
      });
      cashOuts.push(cashOut);
    }
  }

  await writeAuditLog({
    actorId: null,
    action: "leave.year_end_reset",
    entityType: "LeaveQuota",
    entityId: `year-${year}`,
    after: { quotasProcessed: quotas.length, cashOutsCreated: cashOuts.length },
  });

  return { quotasProcessed: quotas.length, cashOutsCreated: cashOuts.length };
}

export async function grantAnniversaryLeave() {
  const today = new Date();
  const employees = await prisma.employee.findMany({
    where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] } },
    select: { id: true, hireDate: true },
  });

  let granted = 0;
  for (const emp of employees) {
    const existingQuota = await prisma.leaveQuota.findFirst({
      where: {
        employeeId: emp.id,
        leaveType: "ANNUAL",
        quotaYear: today.getFullYear(),
      },
    });

    const result = computeAnnualLeaveGrant(emp.hireDate, today, existingQuota);
    if (result.action === "NONE") continue;

    await prisma.leaveQuota.create({
      data: {
        employeeId: emp.id,
        leaveType: "ANNUAL",
        quotaYear: today.getFullYear(),
        eligibleFrom: result.eligibleFrom,
        allocatedDays: result.days,
        isProrated: result.action === "GRANT_PRORATED",
        prorateBasis: "basis" in result ? result.basis : undefined,
      },
    });
    granted++;
  }

  await writeAuditLog({
    actorId: null,
    action: "leave.anniversary_grant",
    entityType: "LeaveQuota",
    entityId: `year-${today.getFullYear()}`,
    after: { employeesChecked: employees.length, granted },
  });

  return { employeesChecked: employees.length, granted };
}
