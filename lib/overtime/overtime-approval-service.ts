import { getPrisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import { notifyOTDecision } from "@/lib/email/ot-notification-sender";
import type { Caller, RequestMeta } from "@/lib/api/types";

export async function getPendingOTForApprover(
  caller: Caller,
  page: number,
  perPage: number,
) {
  const where = { approverId: caller.employeeId, status: "PENDING" as const };

  const prisma = await getPrisma();
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

interface DecideOptions {
  reason?: string;
  /** When true, skip the assigned-approver ownership check.
   *  Caller must already be authorized at the route boundary (HR_ROLES). */
  hrOverride?: boolean;
}

async function decideOT(
  caller: Caller,
  id: string,
  decision: "APPROVED" | "REJECTED",
  meta: RequestMeta,
  opts: DecideOptions = {},
) {
  const { reason, hrOverride = false } = opts;

  const prisma = await getPrisma();
  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.overtimeRequest.findUnique({ where: { id } });
    if (!request) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (request.status !== "PENDING") {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED);
    }
    if (!hrOverride && request.approverId !== caller.employeeId) {
      throw new DomainError(ErrorCodes.NOT_APPROVER, {}, 403);
    }

    const updated = await tx.overtimeRequest.update({
      where: { id },
      data: decision === "APPROVED"
        ? { status: "APPROVED", approvedAt: new Date() }
        : { status: "REJECTED", rejectedReason: reason },
    });

    const baseAction = decision === "APPROVED" ? "overtime.approve" : "overtime.reject";
    await writeAuditLog({
      actorId: caller.userId,
      action: hrOverride ? `${baseAction}.hr_override` : baseAction,
      entityType: "OvertimeRequest",
      entityId: id,
      before: request,
      after: updated,
      reason: hrOverride
        ? (reason ? `HR override: ${reason}` : "HR override")
        : reason,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return updated;
  });

  notifyOTDecision(id, decision).catch(() => {});
  return result;
}

export const approveOT = (caller: Caller, id: string, meta: RequestMeta) =>
  decideOT(caller, id, "APPROVED", meta);

export const rejectOT = (caller: Caller, id: string, reason: string, meta: RequestMeta) =>
  decideOT(caller, id, "REJECTED", meta, { reason });

export const hrApproveOT = (caller: Caller, id: string, meta: RequestMeta) =>
  decideOT(caller, id, "APPROVED", meta, { hrOverride: true });

export const hrRejectOT = (caller: Caller, id: string, reason: string, meta: RequestMeta) =>
  decideOT(caller, id, "REJECTED", meta, { reason, hrOverride: true });
