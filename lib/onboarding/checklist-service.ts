import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { RequestMeta } from "@/lib/api/types";

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Create onboarding checklist for a new employee from the default (or specified) template.
 * Skips silently if no template exists — onboarding is optional.
 */
export async function createChecklistForEmployee(
  employeeId: string,
  templateId?: string,
  tx?: TxClient,
) {
  const client = tx ?? prisma;

  const template = templateId
    ? await client.onboardingTemplate.findUnique({ where: { id: templateId }, include: { items: { orderBy: { sortOrder: "asc" } } } })
    : await client.onboardingTemplate.findFirst({ where: { isDefault: true, isActive: true }, include: { items: { orderBy: { sortOrder: "asc" } } } });

  if (!template || template.items.length === 0) return null;

  return client.onboardingChecklist.create({
    data: {
      employeeId,
      templateId: template.id,
      items: {
        create: template.items.map((item) => ({
          title: item.title,
          description: item.description,
          category: item.category,
          sortOrder: item.sortOrder,
        })),
      },
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getEmployeeChecklist(employeeId: string) {
  const checklist = await prisma.onboardingChecklist.findUnique({
    where: { employeeId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!checklist) return null;

  const total = checklist.items.length;
  const done = checklist.items.filter((i) => i.isDone).length;

  return { ...checklist, progress: { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 } };
}

/** Lightweight query for layout banner — avoids fetching all items */
export async function getOnboardingRemainingCount(employeeId: string): Promise<number> {
  const checklist = await prisma.onboardingChecklist.findUnique({
    where: { employeeId },
    select: { completedAt: true },
  });
  if (!checklist || checklist.completedAt) return 0;

  const [total, done] = await Promise.all([
    prisma.onboardingChecklistItem.count({ where: { checklist: { employeeId } } }),
    prisma.onboardingChecklistItem.count({ where: { checklist: { employeeId }, isDone: true } }),
  ]);
  return total - done;
}

export async function listChecklistsWithProgress(filter?: { completed?: boolean }) {
  const where = filter?.completed !== undefined
    ? { completedAt: filter.completed ? { not: null } : null }
    : {};

  const checklists = await prisma.onboardingChecklist.findMany({
    where,
    include: {
      employee: { select: { id: true, employeeCode: true, firstNameTh: true, lastNameTh: true, hireDate: true } },
      items: { select: { isDone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return checklists.map((c) => {
    const total = c.items.length;
    const done = c.items.filter((i) => i.isDone).length;
    return {
      id: c.id, employeeId: c.employeeId, employee: c.employee,
      completedAt: c.completedAt, createdAt: c.createdAt,
      progress: { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 },
    };
  });
}

interface ToggleOptions {
  itemId: string;
  isDone: boolean;
  actorUserId: string;
  ownerEmployeeId: string;
  meta: RequestMeta;
  skipOwnerCheck?: boolean;
}

export async function toggleChecklistItem(opts: ToggleOptions) {
  const { itemId, isDone, actorUserId, ownerEmployeeId, meta, skipOwnerCheck } = opts;

  const result = await prisma.$transaction(async (tx) => {
    const item = await tx.onboardingChecklistItem.findUnique({
      where: { id: itemId },
      include: { checklist: { select: { id: true, employeeId: true } } },
    });

    if (!item) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (!skipOwnerCheck && item.checklist.employeeId !== ownerEmployeeId) {
      throw new DomainError("NOT_OWNER", {}, 403);
    }

    await tx.onboardingChecklistItem.update({
      where: { id: itemId },
      data: { isDone, doneAt: isDone ? new Date() : null, doneBy: isDone ? actorUserId : null },
    });

    const undoneCount = await tx.onboardingChecklistItem.count({
      where: { checklistId: item.checklist.id, isDone: false },
    });
    const allDone = undoneCount === 0;

    await tx.onboardingChecklist.update({
      where: { id: item.checklist.id },
      data: { completedAt: allDone ? new Date() : null },
    });

    return { isDone, allDone };
  });

  await writeAuditLog({
    actorId: actorUserId, action: isDone ? "onboarding.item.done" : "onboarding.item.undone",
    entityType: "OnboardingChecklistItem", entityId: itemId,
    ipAddress: meta.ip, userAgent: meta.userAgent,
  });

  return result;
}

export async function isOnboardingComplete(employeeId: string): Promise<boolean> {
  const checklist = await prisma.onboardingChecklist.findUnique({
    where: { employeeId },
    select: { completedAt: true },
  });
  return !checklist || checklist.completedAt !== null;
}
