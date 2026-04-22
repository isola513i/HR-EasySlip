// ════════════════════════════════════════════════════════════════
// Time Adjustment Service — submit, approve, reject, withdraw
// On approve: auto-create AttendanceRecord (isBackfilled=true)
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { Role } from "@prisma/client";
import type { TimeAdjSubmit, TimeAdjReject, TimeAdjFilters } from "./schemas";

interface Caller {
  userId: string;
  employeeId: string;
  roles: Role[];
}

interface RequestMeta {
  ip: string;
  userAgent: string;
}

export async function submitRequest(
  caller: Caller,
  input: TimeAdjSubmit,
  meta: RequestMeta,
) {
  const request = await prisma.timeAdjustmentRequest.create({
    data: {
      employeeId: caller.employeeId,
      clockType: input.clockType,
      requestedAt: new Date(input.requestedAt),
      reason: input.reason,
      attachmentUrl: input.attachmentUrl,
    },
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "time_adjustment.submit",
    entityType: "TimeAdjustmentRequest",
    entityId: request.id,
    after: request,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return request;
}

export async function getMyRequests(
  employeeId: string,
  filters: TimeAdjFilters,
) {
  const where = {
    employeeId,
    ...(filters.status && { status: filters.status }),
  };

  const [items, total] = await Promise.all([
    prisma.timeAdjustmentRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.perPage,
      take: filters.perPage,
    }),
    prisma.timeAdjustmentRequest.count({ where }),
  ]);

  return { items, total, page: filters.page, perPage: filters.perPage };
}

export async function getDetail(id: string) {
  const request = await prisma.timeAdjustmentRequest.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          id: true,
          firstNameTh: true,
          lastNameTh: true,
          employeeCode: true,
        },
      },
      approver: {
        select: { id: true, firstNameTh: true, lastNameTh: true },
      },
      attendance: true,
    },
  });

  if (!request) {
    throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
  }

  return request;
}

export async function withdrawRequest(
  caller: Caller,
  id: string,
  meta: RequestMeta,
) {
  const request = await prisma.timeAdjustmentRequest.findUnique({
    where: { id },
  });

  if (!request) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
  if (request.employeeId !== caller.employeeId) {
    throw new DomainError(ErrorCodes.NOT_OWNER, {}, 403);
  }
  if (request.status !== "PENDING") {
    throw new DomainError(ErrorCodes.ALREADY_PROCESSED);
  }

  const updated = await prisma.timeAdjustmentRequest.delete({
    where: { id },
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "time_adjustment.withdraw",
    entityType: "TimeAdjustmentRequest",
    entityId: id,
    before: request,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
}

export async function getPendingForApprover(
  caller: Caller,
  filters: TimeAdjFilters,
) {
  const subordinates = await prisma.employee.findMany({
    where: { managerId: caller.employeeId },
    select: { id: true },
  });
  const employeeIds = subordinates.map((s) => s.id);

  const where = { employeeId: { in: employeeIds }, status: "PENDING" as const };
  const [items, total] = await Promise.all([
    prisma.timeAdjustmentRequest.findMany({
      where,
      include: {
        employee: {
          select: { firstNameTh: true, lastNameTh: true, employeeCode: true },
        },
      },
      orderBy: { createdAt: "asc" },
      skip: (filters.page - 1) * filters.perPage,
      take: filters.perPage,
    }),
    prisma.timeAdjustmentRequest.count({ where }),
  ]);

  return { items, total, page: filters.page, perPage: filters.perPage };
}

export async function approveRequest(
  caller: Caller,
  id: string,
  meta: RequestMeta,
) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.timeAdjustmentRequest.findUnique({
      where: { id },
    });

    if (!request) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (request.status !== "PENDING") {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED);
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
  const request = await prisma.timeAdjustmentRequest.findUnique({
    where: { id },
  });

  if (!request) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
  if (request.status !== "PENDING") {
    throw new DomainError(ErrorCodes.ALREADY_PROCESSED);
  }

  const updated = await prisma.timeAdjustmentRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      approverId: caller.employeeId,
      rejectedReason: input.reason,
    },
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "time_adjustment.reject",
    entityType: "TimeAdjustmentRequest",
    entityId: id,
    before: request,
    after: updated,
    reason: input.reason,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
}
