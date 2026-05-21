// Mirrors the leave approval flow; APPROVED claims emit a payroll
// outbox event so Empeo can reimburse on payday.
import { Decimal } from "@prisma/client/runtime/library";
import { ExpenseStatus, type Role, type PrismaClient } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import { logger } from "@/lib/observability/logger";
import { isSensitiveDataRole } from "@/lib/security/role-helpers";
import type { Caller, RequestMeta } from "@/lib/api/types";
import type { ExpenseCreateInput, ExpenseDecisionInput } from "./schemas";

export { listMyExpenses, listAllForHR, listPendingForApprover } from "./expense-queries";

export async function createExpenseClaim(
  caller: Caller,
  input: ExpenseCreateInput,
  meta: RequestMeta,
) {
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    if (input.receiptDocumentId) {
      const doc = await tx.document.findUnique({
        where: { id: input.receiptDocumentId },
        select: { ownerEmployeeId: true },
      });
      if (!doc || doc.ownerEmployeeId !== caller.employeeId) {
        throw new DomainError(ErrorCodes.RECEIPT_NOT_OWNED, {}, 400);
      }
    }

    const claim = await tx.expenseClaim.create({
      data: {
        employeeId: caller.employeeId,
        amountTHB: new Decimal(input.amountTHB.toFixed(2)),
        category: input.category,
        description: input.description,
        occurredOn: new Date(input.occurredOn),
        receiptDocumentId: input.receiptDocumentId ?? null,
      },
    });

    await writeAuditLog({
      actorId: caller.userId,
      action: "expense.submitted",
      entityType: "ExpenseClaim",
      entityId: claim.id,
      after: claim,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return claim;
  });
}

export async function cancelExpenseClaim(caller: Caller, id: string, meta: RequestMeta) {
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const claim = await tx.expenseClaim.findUnique({ where: { id } });
    if (!claim) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (claim.employeeId !== caller.employeeId) {
      throw new DomainError(ErrorCodes.NOT_OWNER, {}, 403);
    }
    if (claim.status !== ExpenseStatus.PENDING) {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED, { status: claim.status });
    }

    const updated = await tx.expenseClaim.update({
      where: { id },
      data: { status: ExpenseStatus.CANCELLED },
    });

    await writeAuditLog({
      actorId: caller.userId,
      action: "expense.cancelled",
      entityType: "ExpenseClaim",
      entityId: id,
      before: claim,
      after: updated,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return updated;
  });
}

export async function decideExpenseClaim(
  caller: Caller,
  id: string,
  input: ExpenseDecisionInput,
  meta: RequestMeta,
) {
  const hrOverride = isSensitiveDataRole(caller.roles);
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const claim = await tx.expenseClaim.findUnique({
      where: { id },
      include: { employee: { select: { managerId: true } } },
    });
    if (!claim) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (claim.status !== ExpenseStatus.PENDING) {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED, { status: claim.status });
    }
    if (!hrOverride && claim.employee.managerId !== caller.employeeId) {
      throw new DomainError(ErrorCodes.NOT_APPROVER, {}, 403);
    }

    const now = new Date();
    const isApproved = input.decision === ExpenseStatus.APPROVED;
    const updated = await tx.expenseClaim.update({
      where: { id },
      data: isApproved
        ? { status: ExpenseStatus.APPROVED, approverId: caller.employeeId, approvedAt: now, rejectReason: null }
        : {
            status: ExpenseStatus.REJECTED,
            approverId: caller.employeeId,
            rejectedAt: now,
            rejectReason: input.rejectReason ?? null,
          },
    });

    if (isApproved) {
      await emitApprovedOutbox(tx, claim);
    }

    await writeAuditLog({
      actorId: caller.userId,
      action: isApproved ? "expense.approved" : "expense.rejected",
      entityType: "ExpenseClaim",
      entityId: id,
      before: claim,
      after: updated,
      reason: input.rejectReason,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return updated;
  });
}

type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

async function emitApprovedOutbox(
  tx: TxClient,
  claim: { id: string; employeeId: string; amountTHB: Decimal; category: Role | string; occurredOn: Date },
) {
  const cycle = await tx.payrollCycle.findFirst({
    where: { status: "OPEN", cycleEnd: { gte: new Date() } },
    orderBy: { cycleEnd: "asc" },
  });
  if (!cycle) {
    logger.warn("Approved expense has no open payroll cycle", { claimId: claim.id });
    return;
  }
  await tx.payrollOutboxEvent.create({
    data: {
      payrollCycleId: cycle.id,
      eventType: "expense.approved",
      aggregateId: claim.id,
      payload: {
        claimId: claim.id,
        employeeId: claim.employeeId,
        amountTHB: claim.amountTHB.toString(),
        category: claim.category,
        occurredOn: claim.occurredOn.toISOString(),
      },
      idempotencyKey: `expense-approved:${claim.id}`,
      status: "PENDING",
    },
  });
}
