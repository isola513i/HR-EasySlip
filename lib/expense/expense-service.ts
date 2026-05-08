// ════════════════════════════════════════════════════════════════
// Expense Claim Service — request → approve/reject → outbox.
// ----------------------------------------------------------------
// Mirrors the leave approval flow: employee submits, the assigned
// manager (or HR override) decides, an APPROVED claim emits a
// PayrollOutboxEvent so Empeo can reimburse on payday.
// ════════════════════════════════════════════════════════════════

import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { Caller, RequestMeta } from "@/lib/api/types";
import type {
  ExpenseCreateInput,
  ExpenseDecisionInput,
  ExpenseListFilters,
} from "./schemas";

export async function listMyExpenses(employeeId: string, filters: ExpenseListFilters) {
  const where = {
    employeeId,
    ...(filters.status ? { status: filters.status } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.expenseClaim.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.perPage,
      take: filters.perPage,
    }),
    prisma.expenseClaim.count({ where }),
  ]);
  return { items, total, page: filters.page, perPage: filters.perPage };
}

export async function listPendingForApprover(employeeId: string) {
  const subordinates = await prisma.employee.findMany({
    where: { managerId: employeeId },
    select: { id: true },
  });
  const ids = subordinates.map((s) => s.id);
  if (ids.length === 0) return [];
  return prisma.expenseClaim.findMany({
    where: { employeeId: { in: ids }, status: "PENDING" },
    include: {
      employee: {
        select: { id: true, employeeCode: true, firstNameTh: true, lastNameTh: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function listAllForHR(filters: ExpenseListFilters) {
  const where = filters.status ? { status: filters.status } : {};
  const [items, total] = await Promise.all([
    prisma.expenseClaim.findMany({
      where,
      include: {
        employee: {
          select: { id: true, employeeCode: true, firstNameTh: true, lastNameTh: true },
        },
        approver: {
          select: { id: true, employeeCode: true, firstNameTh: true, lastNameTh: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.perPage,
      take: filters.perPage,
    }),
    prisma.expenseClaim.count({ where }),
  ]);
  return { items, total, page: filters.page, perPage: filters.perPage };
}

export async function createExpenseClaim(
  caller: Caller,
  input: ExpenseCreateInput,
  meta: RequestMeta,
) {
  return prisma.$transaction(async (tx) => {
    const employee = await tx.employee.findUnique({
      where: { id: caller.employeeId },
      select: { id: true, managerId: true },
    });
    if (!employee) throw new DomainError(ErrorCodes.EMPLOYEE_NOT_FOUND, {}, 404);

    if (input.receiptDocumentId) {
      const doc = await tx.document.findUnique({
        where: { id: input.receiptDocumentId },
        select: { id: true, ownerEmployeeId: true },
      });
      if (!doc || doc.ownerEmployeeId !== caller.employeeId) {
        throw new DomainError("INVALID_RECEIPT", { message: "Receipt does not belong to you" }, 400);
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

export async function cancelExpenseClaim(
  caller: Caller,
  id: string,
  meta: RequestMeta,
) {
  return prisma.$transaction(async (tx) => {
    const claim = await tx.expenseClaim.findUnique({ where: { id } });
    if (!claim) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (claim.employeeId !== caller.employeeId) {
      throw new DomainError(ErrorCodes.NOT_OWNER, {}, 403);
    }
    if (claim.status !== "PENDING") {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED, { status: claim.status });
    }

    const updated = await tx.expenseClaim.update({
      where: { id },
      data: { status: "CANCELLED" },
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

interface DecideOptions {
  hrOverride?: boolean;
}

export async function decideExpenseClaim(
  caller: Caller,
  id: string,
  input: ExpenseDecisionInput,
  meta: RequestMeta,
  opts: DecideOptions = {},
) {
  return prisma.$transaction(async (tx) => {
    const claim = await tx.expenseClaim.findUnique({
      where: { id },
      include: { employee: { select: { managerId: true } } },
    });
    if (!claim) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (claim.status !== "PENDING") {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED, { status: claim.status });
    }
    if (!opts.hrOverride && claim.employee.managerId !== caller.employeeId) {
      throw new DomainError(ErrorCodes.NOT_APPROVER, {}, 403);
    }
    if (input.decision === "REJECTED" && !input.rejectReason) {
      throw new DomainError("REASON_REQUIRED", { message: "Reject reason is required" }, 400);
    }

    const now = new Date();
    const updated = await tx.expenseClaim.update({
      where: { id },
      data:
        input.decision === "APPROVED"
          ? { status: "APPROVED", approverId: caller.employeeId, approvedAt: now, rejectReason: null }
          : {
              status: "REJECTED",
              approverId: caller.employeeId,
              rejectedAt: now,
              rejectReason: input.rejectReason ?? null,
            },
    });

    if (input.decision === "APPROVED") {
      const cycle = await tx.payrollCycle.findFirst({
        where: { status: "OPEN", cycleEnd: { gte: now } },
        orderBy: { cycleEnd: "asc" },
      });
      if (cycle) {
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
    }

    await writeAuditLog({
      actorId: caller.userId,
      action: input.decision === "APPROVED" ? "expense.approved" : "expense.rejected",
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
