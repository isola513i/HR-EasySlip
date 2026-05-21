// ════════════════════════════════════════════════════════════════
// Time Adjustment Approval Service — approve, reject (Manager ops)
// Enforces: no self-approval, manager-subordinate check
// ════════════════════════════════════════════════════════════════

import { getPrisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { Caller, RequestMeta } from "@/lib/api/types";
import type { TimeAdjReject } from "./schemas";

export async function approveRequest(
  caller: Caller,
  id: string,
  meta: RequestMeta,
) {
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const request = await tx.timeAdjustmentRequest.findUnique({
      where: { id },
    });

    if (!request) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (request.status !== "PENDING") {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED);
    }

    // Block self-approval
    if (request.employeeId === caller.employeeId) {
      throw new DomainError("SELF_APPROVAL_NOT_ALLOWED", {}, 403);
    }

    // Verify caller is direct manager of requester
    const subordinate = await tx.employee.findFirst({
      where: { id: request.employeeId, managerId: caller.employeeId },
      select: { id: true },
    });
    if (!subordinate) {
      throw new DomainError(ErrorCodes.NOT_APPROVER, {}, 403);
    }

    // Auto-create AttendanceRecord
    const attendance = await tx.attendanceRecord.create({
      data: {
        employeeId: request.employeeId,
        clockType: request.clockType,
        clockedAt: request.requestedAt,
        workLocation: "OFFICE",
        isBackfilled: true,
        backfillReason: "time-adjustment-approved",
        backfilledBy: caller.userId,
        ipAddress: meta.ip,
      },
    });

    const updated = await tx.timeAdjustmentRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        approverId: caller.employeeId,
        approvedAt: new Date(),
        attendanceId: attendance.id,
      },
    });

    await writeAuditLog(
      {
        actorId: caller.userId,
        action: "time_adjustment.approve",
        entityType: "TimeAdjustmentRequest",
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

export async function rejectRequest(
  caller: Caller,
  id: string,
  input: TimeAdjReject,
  meta: RequestMeta,
) {
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const request = await tx.timeAdjustmentRequest.findUnique({
      where: { id },
    });

    if (!request) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (request.status !== "PENDING") {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED);
    }

    // Block self-rejection
    if (request.employeeId === caller.employeeId) {
      throw new DomainError("SELF_APPROVAL_NOT_ALLOWED", {}, 403);
    }

    // Verify caller is direct manager of requester
    const subordinate = await tx.employee.findFirst({
      where: { id: request.employeeId, managerId: caller.employeeId },
      select: { id: true },
    });
    if (!subordinate) {
      throw new DomainError(ErrorCodes.NOT_APPROVER, {}, 403);
    }

    const updated = await tx.timeAdjustmentRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        approverId: caller.employeeId,
        rejectedReason: input.reason,
      },
    });

    await writeAuditLog(
      {
        actorId: caller.userId,
        action: "time_adjustment.reject",
        entityType: "TimeAdjustmentRequest",
        entityId: id,
        before: request,
        after: updated,
        reason: input.reason,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
      tx,
    );

    return updated;
  });
}
