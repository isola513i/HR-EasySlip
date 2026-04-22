// ════════════════════════════════════════════════════════════════
// Leave Service — submit, withdraw, preview (Employee operations)
// ════════════════════════════════════════════════════════════════

import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { assertCycleOpen } from "@/lib/api/cycle-guard";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import { calculateWorkingDays } from "./working-days";
import type { Caller, RequestMeta } from "@/lib/api/types";
import type { LeaveRequestInput } from "./schemas";

export async function submitLeaveRequest(
  caller: Caller,
  input: LeaveRequestInput,
  meta: RequestMeta,
) {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  await assertCycleOpen(startDate, caller.roles);

  const days = await calculateWorkingDays(startDate, endDate, input.halfDay);
  const daysDecimal = new Decimal(days);

  return prisma.$transaction(async (tx) => {
    // Lock and check quota (except LWP which has no limit)
    let quotaId: string | undefined;
    if (input.leaveType !== "LEAVE_WITHOUT_PAY") {
      const quota = await tx.leaveQuota.findFirst({
        where: {
          employeeId: caller.employeeId,
          leaveType: input.leaveType,
          quotaYear: startDate.getFullYear(),
        },
      });

      if (!quota) {
        throw new DomainError(ErrorCodes.NO_QUOTA_RECORD, {
          leaveType: input.leaveType,
          year: startDate.getFullYear(),
        });
      }

      const available = quota.allocatedDays
        .minus(quota.usedDays)
        .minus(quota.pendingDays);

      if (available.lt(daysDecimal)) {
        throw new DomainError(ErrorCodes.INSUFFICIENT_QUOTA, {
          available: available.toString(),
          requested: days,
        });
      }

      // Reserve as pending
      await tx.leaveQuota.update({
        where: { id: quota.id },
        data: { pendingDays: { increment: days } },
      });
      quotaId = quota.id;
    }

    // Resolve approver (direct manager)
    const employee = await tx.employee.findUnique({
      where: { id: caller.employeeId },
      select: { managerId: true },
    });

    const request = await tx.leaveRequest.create({
      data: {
        employeeId: caller.employeeId,
        leaveType: input.leaveType,
        startDate,
        endDate,
        halfDay: input.halfDay,
        daysRequested: daysDecimal,
        reason: input.reason,
        attachmentUrl: input.attachmentUrl,
        status: "PENDING",
        approverId: employee?.managerId,
        quotaLockedId: quotaId,
      },
    });

    await writeAuditLog(
      {
        actorId: caller.userId,
        action: "leave.submit",
        entityType: "LeaveRequest",
        entityId: request.id,
        after: request,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
      tx,
    );

    return request;
  }, { isolationLevel: "Serializable" });
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

    const updated = await tx.leaveRequest.update({
      where: { id },
      data: { status: "WITHDRAWN" },
    });

    await writeAuditLog(
      {
        actorId: caller.userId,
        action: "leave.withdraw",
        entityType: "LeaveRequest",
        entityId: id,
        before: request,
        after: updated,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
      tx,
    );

    return updated;
  });
}

// Query functions (previewLeave, getMyLeaveRequests, getLeaveRequestDetail)
// are in leave-query-service.ts to keep this file under 200 lines.
