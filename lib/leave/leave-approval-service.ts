// ════════════════════════════════════════════════════════════════
// Leave Approval Service — approve, reject, bulk (Manager ops)
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
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

export async function getPendingForApprover(
  caller: Caller,
  page: number,
  perPage: number,
) {
  const where = { approverId: caller.employeeId, status: "PENDING" as const };

  const [items, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            firstNameTh: true,
            lastNameTh: true,
            employeeCode: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  return { items, total, page, perPage };
}

export async function approveLeaveRequest(
  caller: Caller,
  id: string,
  meta: RequestMeta,
) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.leaveRequest.findUnique({ where: { id } });
    if (!request) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (request.status !== "PENDING") {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED);
    }
    if (request.approverId !== caller.employeeId) {
      throw new DomainError(ErrorCodes.NOT_APPROVER, {}, 403);
    }

    // Move pending → used in quota
    if (request.quotaLockedId) {
      await tx.leaveQuota.update({
        where: { id: request.quotaLockedId },
        data: {
          pendingDays: { decrement: request.daysRequested.toNumber() },
          usedDays: { increment: request.daysRequested.toNumber() },
        },
      });
    }

    const updated = await tx.leaveRequest.update({
      where: { id },
      data: { status: "APPROVED", approvedAt: new Date() },
    });

    await writeAuditLog(
      {
        actorId: caller.userId,
        action: "leave.approve",
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

export async function rejectLeaveRequest(
  caller: Caller,
  id: string,
  reason: string,
  meta: RequestMeta,
) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.leaveRequest.findUnique({ where: { id } });
    if (!request) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (request.status !== "PENDING") {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED);
    }
    if (request.approverId !== caller.employeeId) {
      throw new DomainError(ErrorCodes.NOT_APPROVER, {}, 403);
    }

    // Release pending quota
    if (request.quotaLockedId) {
      await tx.leaveQuota.update({
        where: { id: request.quotaLockedId },
        data: {
          pendingDays: { decrement: request.daysRequested.toNumber() },
        },
      });
    }

    const updated = await tx.leaveRequest.update({
      where: { id },
      data: { status: "REJECTED", rejectedReason: reason },
    });

    await writeAuditLog(
      {
        actorId: caller.userId,
        action: "leave.reject",
        entityType: "LeaveRequest",
        entityId: id,
        before: request,
        after: updated,
        reason,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
      tx,
    );

    return updated;
  });
}

export async function bulkDecision(
  caller: Caller,
  ids: string[],
  decision: "APPROVED" | "REJECTED",
  reason: string | undefined,
  meta: RequestMeta,
) {
  const results = [];
  for (const id of ids) {
    if (decision === "APPROVED") {
      results.push(await approveLeaveRequest(caller, id, meta));
    } else {
      results.push(await rejectLeaveRequest(caller, id, reason ?? "", meta));
    }
  }
  return results;
}

export async function getTeamCalendar(
  caller: Caller,
  month: number,
  year: number,
) {
  const subordinates = await prisma.employee.findMany({
    where: { managerId: caller.employeeId },
    select: { id: true },
  });
  const employeeIds = [caller.employeeId, ...subordinates.map((s) => s.id)];

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // last day of month

  const requests = await prisma.leaveRequest.findMany({
    where: {
      employeeId: { in: employeeIds },
      status: { in: ["PENDING", "APPROVED"] },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    include: {
      employee: {
        select: {
          id: true,
          firstNameTh: true,
          lastNameTh: true,
          employeeCode: true,
        },
      },
    },
    orderBy: { startDate: "asc" },
  });

  return requests;
}
