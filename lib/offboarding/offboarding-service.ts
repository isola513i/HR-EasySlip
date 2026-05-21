import { Prisma, type EmploymentStatus } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import { computeResignationAnnualProrate } from "@/lib/leave/annual-quota-engine";
import { loadLeavePolicy } from "@/lib/leave/policy";
import type { Caller, RequestMeta } from "@/lib/api/types";

export type OffboardingReason = "RESIGNATION" | "TERMINATION" | "RETIREMENT" | "CONTRACT_END";

export interface OffboardingItem {
  key: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

// Item keys are stable identifiers; UI resolves labels via i18n
// (`t.hr.offboarding.items[key]`) per CLAUDE.md §6.
const DEFAULT_ITEM_KEYS = [
  "asset_return",
  "knowledge_transfer",
  "exit_interview",
  "final_pay_settlement",
  "access_revocation",
  "ssf_notification",
] as const;

const REASON_TO_STATUS: Record<OffboardingReason, EmploymentStatus> = {
  RESIGNATION: "RESIGNED",
  TERMINATION: "TERMINATED",
  RETIREMENT: "RETIRED",
  CONTRACT_END: "CONTRACT_ENDED",
};

const REASON_TO_CASHOUT_TRIGGER: Record<OffboardingReason, "RESIGNATION" | "TERMINATION"> = {
  RESIGNATION: "RESIGNATION",
  TERMINATION: "TERMINATION",
  RETIREMENT: "RESIGNATION",
  CONTRACT_END: "TERMINATION",
};

interface StartInput {
  employeeId: string;
  reason: OffboardingReason;
  lastDay: string; // ISO date
  notes?: string;
}

export async function startOffboarding(caller: Caller, input: StartInput, meta: RequestMeta) {
  const policy = await loadLeavePolicy();
  const lastDay = new Date(input.lastDay);
  const prisma = await getPrisma();

  return prisma.$transaction(async (tx) => {
    const employee = await tx.employee.findUnique({
      where: { id: input.employeeId },
      select: { id: true, employmentStatus: true, hireDate: true },
    });
    if (!employee) throw new DomainError(ErrorCodes.EMPLOYEE_NOT_FOUND, {}, 404);

    const existing = await tx.offboardingChecklist.findUnique({
      where: { employeeId: input.employeeId },
    });
    if (existing) {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED, { message: "Offboarding already started" });
    }

    const checklist = await tx.offboardingChecklist.create({
      data: {
        employeeId: input.employeeId,
        reason: input.reason,
        lastDay,
        notes: input.notes ?? null,
        items: DEFAULT_ITEM_KEYS.map((key) => ({ key, completed: false })),
      },
    });

    // Mirror reason → status + record termination date for downstream
    // (cashout, payroll exports, headcount reports key off these fields).
    await tx.employee.update({
      where: { id: input.employeeId },
      data: {
        employmentStatus: REASON_TO_STATUS[input.reason],
        terminationDate: lastDay,
      },
    });

    // Auto-create cashout for unused annual leave using the canonical
    // resignation-prorate formula. usedDays only — pending requests get
    // settled separately during the offboarding window.
    const annualQuota = await tx.leaveQuota.findFirst({
      where: { employeeId: input.employeeId, leaveType: "ANNUAL", quotaYear: lastDay.getFullYear() },
    });
    if (annualQuota) {
      const unused = computeResignationAnnualProrate(
        {
          hireDate: employee.hireDate,
          terminationDate: lastDay,
          usedDays: annualQuota.usedDays,
        },
        policy.annual,
      );
      if (unused.gt(0)) {
        const trigger = REASON_TO_CASHOUT_TRIGGER[input.reason];
        await tx.annualLeaveCashOut.upsert({
          where: { employeeId_year: { employeeId: input.employeeId, year: lastDay.getFullYear() } },
          create: { employeeId: input.employeeId, year: lastDay.getFullYear(), unusedDays: unused, trigger },
          update: { unusedDays: unused, trigger },
        });
      }
    }

    await writeAuditLog({
      actorId: caller.userId,
      action: "offboarding.started",
      entityType: "OffboardingChecklist",
      entityId: checklist.id,
      after: { ...checklist, items: undefined },
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return checklist;
  });
}

export async function listOffboarding(status?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED") {
  const prisma = await getPrisma();
  return prisma.offboardingChecklist.findMany({
    where: status ? { status } : undefined,
    include: {
      employee: {
        select: { id: true, employeeCode: true, firstNameTh: true, lastNameTh: true, employmentStatus: true },
      },
    },
    orderBy: { lastDay: "desc" },
  });
}

export async function getOffboardingForEmployee(employeeId: string) {
  const prisma = await getPrisma();
  return prisma.offboardingChecklist.findUnique({
    where: { employeeId },
    include: {
      employee: {
        select: { id: true, employeeCode: true, firstNameTh: true, lastNameTh: true },
      },
    },
  });
}

export async function toggleItem(
  caller: Caller,
  checklistId: string,
  itemKey: string,
  completed: boolean,
  meta: RequestMeta,
) {
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const checklist = await tx.offboardingChecklist.findUnique({ where: { id: checklistId } });
    if (!checklist) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (checklist.status !== "IN_PROGRESS") {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED, { status: checklist.status });
    }

    const items = (checklist.items as unknown as OffboardingItem[]).map((it) =>
      it.key === itemKey
        ? {
            ...it,
            completed,
            completedAt: completed ? new Date().toISOString() : undefined,
            completedBy: completed ? caller.userId : undefined,
          }
        : it,
    );

    const updated = await tx.offboardingChecklist.update({
      where: { id: checklistId },
      data: { items: items as unknown as Prisma.InputJsonValue },
    });

    await writeAuditLog({
      actorId: caller.userId,
      action: "offboarding.item_toggled",
      entityType: "OffboardingChecklist",
      entityId: checklistId,
      after: { itemKey, completed },
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return updated;
  });
}

export async function completeOffboarding(caller: Caller, checklistId: string, meta: RequestMeta) {
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const checklist = await tx.offboardingChecklist.findUnique({ where: { id: checklistId } });
    if (!checklist) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (checklist.status !== "IN_PROGRESS") {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED, { status: checklist.status });
    }

    const updated = await tx.offboardingChecklist.update({
      where: { id: checklistId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    await writeAuditLog({
      actorId: caller.userId,
      action: "offboarding.completed",
      entityType: "OffboardingChecklist",
      entityId: checklistId,
      before: checklist,
      after: updated,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return updated;
  });
}
