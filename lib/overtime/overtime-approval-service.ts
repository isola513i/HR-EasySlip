// ════════════════════════════════════════════════════════════════
// Overtime Approval Service — approve, reject, pending (Manager ops)
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { Caller, RequestMeta } from "@/lib/api/types";

export async function getPendingOTForApprover(
  caller: Caller,
  page: number,
  perPage: number,
) {
  const where = { approverId: caller.employeeId, status: "PENDING" as const };

  const [items, total] = await Promise.all([
    prisma.overtimeRequest.findMany({
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
    prisma.overtimeRequest.count({ where }),
  ]);

  return { items, total, page, perPage };
}

export async function approveOT(
  caller: Caller,
  id: string,
  meta: RequestMeta,
) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.overtimeRequest.findUnique({ where: { id } });
    if (!request) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (request.status !== "PENDING") {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED);
    }
    if (request.approverId !== caller.employeeId) {
      throw new DomainError(ErrorCodes.NOT_APPROVER, {}, 403);
    }

    const updated = await tx.overtimeRequest.update({
      where: { id },
      data: { status: "APPROVED", approvedAt: new Date() },
    });

    await writeAuditLog({
      actorId: caller.userId,
      action: "overtime.approve",
      entityType: "OvertimeRequest",
      entityId: id,
      before: request,
      after: updated,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return updated;
  });
}

export async function rejectOT(
  caller: Caller,
  id: string,
  reason: string,
  meta: RequestMeta,
) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.overtimeRequest.findUnique({ where: { id } });
    if (!request) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (request.status !== "PENDING") {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED);
    }
    if (request.approverId !== caller.employeeId) {
      throw new DomainError(ErrorCodes.NOT_APPROVER, {}, 403);
    }

    const updated = await tx.overtimeRequest.update({
      where: { id },
      data: { status: "REJECTED", rejectedReason: reason },
    });

    await writeAuditLog({
      actorId: caller.userId,
      action: "overtime.reject",
      entityType: "OvertimeRequest",
      entityId: id,
      before: request,
      after: updated,
      reason,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return updated;
  });
}
