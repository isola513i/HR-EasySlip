// ════════════════════════════════════════════════════════════════
// Time Adjustment Service — submit, withdraw, list, detail
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { Caller, RequestMeta } from "@/lib/api/types";
import type { TimeAdjSubmit, TimeAdjFilters } from "./schemas";

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

export async function getDetail(id: string, caller: Caller) {
  const request = await prisma.timeAdjustmentRequest.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          id: true,
          firstNameTh: true,
          lastNameTh: true,
          employeeCode: true,
          managerId: true,
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

  // Ownership check: owner, direct manager, or HR
  const isOwner = request.employeeId === caller.employeeId;
  const isManager = request.employee.managerId === caller.employeeId;
  const isHR = caller.roles.some((r) =>
    (["HRMG", "HR_AUTHORIZED", "CEO", "CTO", "COO"] as string[]).includes(r),
  );
  if (!isOwner && !isManager && !isHR) {
    throw new DomainError(ErrorCodes.NOT_OWNER, {}, 403);
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

  const updated = await prisma.timeAdjustmentRequest.update({
    where: { id },
    data: { status: "REJECTED", rejectedReason: "withdrawn-by-owner" },
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "time_adjustment.withdraw",
    entityType: "TimeAdjustmentRequest",
    entityId: id,
    before: request,
    after: updated,
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

// Approval functions (approveRequest, rejectRequest) are in
// time-adjustment-approval-service.ts to keep this file under 200 lines.
