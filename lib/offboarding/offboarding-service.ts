import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { Caller, RequestMeta } from "@/lib/api/types";

export type OffboardingReason = "RESIGNATION" | "TERMINATION" | "RETIREMENT" | "CONTRACT_END";

export interface OffboardingItem {
  key: string;
  label: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

const DEFAULT_ITEMS: { key: string; label: string }[] = [
  { key: "asset_return", label: "Return company assets (laptop, phone, equipment)" },
  { key: "knowledge_transfer", label: "Knowledge transfer to team members" },
  { key: "exit_interview", label: "Exit interview with HR" },
  { key: "final_pay_settlement", label: "Final pay + cashout settlement" },
  { key: "access_revocation", label: "Revoke system access (email, SSO, tools)" },
  { key: "ssf_notification", label: "Social Security Fund (SSF) termination notice" },
];

interface StartInput {
  employeeId: string;
  reason: OffboardingReason;
  lastDay: string; // ISO date
  notes?: string;
}

export async function startOffboarding(caller: Caller, input: StartInput, meta: RequestMeta) {
  return prisma.$transaction(async (tx) => {
    const employee = await tx.employee.findUnique({
      where: { id: input.employeeId },
      select: { id: true, employmentStatus: true },
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
        lastDay: new Date(input.lastDay),
        notes: input.notes ?? null,
        items: DEFAULT_ITEMS.map((it) => ({ ...it, completed: false })),
      },
    });

    // Update employment status to align with offboarding reason
    const newStatus = input.reason === "TERMINATION" ? "TERMINATED" : "RESIGNED";
    await tx.employee.update({
      where: { id: input.employeeId },
      data: { employmentStatus: newStatus },
    });

    // Auto-create a cashout record for unused annual leave (mirrors year-end logic)
    const year = new Date(input.lastDay).getFullYear();
    const annualQuota = await tx.leaveQuota.findFirst({
      where: { employeeId: input.employeeId, leaveType: "ANNUAL", quotaYear: year },
    });
    if (annualQuota) {
      const unused = annualQuota.allocatedDays.minus(annualQuota.usedDays).minus(annualQuota.pendingDays);
      if (unused.gt(0)) {
        const trigger = input.reason === "TERMINATION" ? "TERMINATION" : "RESIGNATION";
        await tx.annualLeaveCashOut.upsert({
          where: { employeeId_year: { employeeId: input.employeeId, year } },
          create: { employeeId: input.employeeId, year, unusedDays: unused, trigger },
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
