import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { assertCycleOpen } from "@/lib/api/cycle-guard";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import { calculateWorkingDays } from "./working-days";
import { submitSickWithOverflow } from "./sick-overflow";
import type { Caller, RequestMeta } from "@/lib/api/types";
import type { LeaveRequestInput } from "./schemas";

interface SubmitResult {
  request: { id: string; [key: string]: unknown };
  overflow: { id: string; [key: string]: unknown } | null;
}

export async function submitLeaveRequest(
  caller: Caller,
  input: LeaveRequestInput,
  meta: RequestMeta,
): Promise<SubmitResult> {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  await assertCycleOpen(startDate, caller.roles);

  const days = await calculateWorkingDays(startDate, endDate, input.halfDay);
  const daysDecimal = new Decimal(days);

  const result = await prisma.$transaction(async (tx) => {
    // LWP has no quota — skip check entirely
    if (input.leaveType === "LEAVE_WITHOUT_PAY") {
      const employee = await tx.employee.findUnique({
        where: { id: caller.employeeId },
        select: { managerId: true },
      });
      const request = await tx.leaveRequest.create({
        data: {
          employeeId: caller.employeeId, leaveType: "LEAVE_WITHOUT_PAY",
          startDate, endDate, halfDay: input.halfDay, daysRequested: daysDecimal,
          reason: input.reason, attachmentUrl: input.attachmentUrl,
          status: "PENDING", approverId: employee?.managerId,
        },
      });
      await writeAuditLog({ actorId: caller.userId, action: "leave.submit", entityType: "LeaveRequest", entityId: request.id, after: request, ipAddress: meta.ip, userAgent: meta.userAgent }, tx);
      return { request, overflow: null } satisfies SubmitResult;
    }

    // Find quota for this leave type
    const quota = await tx.leaveQuota.findFirst({
      where: { employeeId: caller.employeeId, leaveType: input.leaveType, quotaYear: startDate.getFullYear() },
    });
    if (!quota) {
      throw new DomainError(ErrorCodes.NO_QUOTA_RECORD, { leaveType: input.leaveType, year: startDate.getFullYear() });
    }

    // SICK overflow: auto-split to LWP when exceeding quota
    if (input.leaveType === "SICK") {
      return submitSickWithOverflow(tx, caller, { startDate, endDate, halfDay: input.halfDay, reason: input.reason, attachmentUrl: input.attachmentUrl }, daysDecimal, quota, meta);
    }

    // All other leave types: strict quota check
    const available = quota.allocatedDays.minus(quota.usedDays).minus(quota.pendingDays);
    if (available.lt(daysDecimal)) {
      throw new DomainError(ErrorCodes.INSUFFICIENT_QUOTA, { available: available.toString(), requested: days });
    }

    await tx.leaveQuota.update({ where: { id: quota.id }, data: { pendingDays: { increment: days } } });

    const employee = await tx.employee.findUnique({ where: { id: caller.employeeId }, select: { managerId: true } });
    const request = await tx.leaveRequest.create({
      data: {
        employeeId: caller.employeeId, leaveType: input.leaveType,
        startDate, endDate, halfDay: input.halfDay, daysRequested: daysDecimal,
        reason: input.reason, attachmentUrl: input.attachmentUrl,
        status: "PENDING", approverId: employee?.managerId, quotaLockedId: quota.id,
      },
    });

    await writeAuditLog({ actorId: caller.userId, action: "leave.submit", entityType: "LeaveRequest", entityId: request.id, after: request, ipAddress: meta.ip, userAgent: meta.userAgent }, tx);
    return { request, overflow: null } satisfies SubmitResult;
  }, { isolationLevel: "Serializable" });

  // Fire-and-forget notification to approver
  import("@/lib/email/leave-notification-sender")
    .then((m) => m.notifyLeaveSubmitted(result.request.id))
    .catch(console.error);

  // Notify for overflow child (auto-generated LWP)
  if (result.overflow) {
    import("@/lib/email/leave-notification-sender")
      .then((m) => m.notifyLeaveSubmitted(result.overflow!.id))
      .catch(console.error);
  }

  return result;
}

export async function withdrawLeaveRequest(
  caller: Caller,
  id: string,
  meta: RequestMeta,
) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.leaveRequest.findUnique({ where: { id } });
    if (!request) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (request.employeeId !== caller.employeeId) {
      throw new DomainError(ErrorCodes.NOT_OWNER, {}, 403);
    }
    if (request.status !== "PENDING") {
      throw new DomainError(ErrorCodes.INVALID_STATUS, { current: request.status });
    }

    // Release pending quota
    if (request.quotaLockedId) {
      await tx.leaveQuota.update({
        where: { id: request.quotaLockedId },
        data: { pendingDays: { decrement: request.daysRequested.toNumber() } },
      });
    }

    const updated = await tx.leaveRequest.update({ where: { id }, data: { status: "WITHDRAWN" } });

    // Cascade withdraw auto-generated children
    const children = await tx.leaveRequest.findMany({
      where: { parentRequestId: id, autoGenerated: true, status: "PENDING" },
    });
    for (const child of children) {
      await tx.leaveRequest.update({ where: { id: child.id }, data: { status: "WITHDRAWN" } });
      await writeAuditLog({ actorId: caller.userId, action: "leave.withdraw_cascade", entityType: "LeaveRequest", entityId: child.id, before: child, after: { ...child, status: "WITHDRAWN" }, ipAddress: meta.ip, userAgent: meta.userAgent }, tx);
    }

    await writeAuditLog({ actorId: caller.userId, action: "leave.withdraw", entityType: "LeaveRequest", entityId: id, before: request, after: updated, ipAddress: meta.ip, userAgent: meta.userAgent }, tx);
    return updated;
  });
}
