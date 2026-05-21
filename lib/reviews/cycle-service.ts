import { getPrisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { Caller, RequestMeta } from "@/lib/api/types";
import type { ReviewCycleCreateInput } from "./schemas";

export async function listCycles(status?: "DRAFT" | "ACTIVE" | "CLOSED") {
  const prisma = await getPrisma();
  return prisma.reviewCycle.findMany({
    where: status ? { status } : undefined,
    include: {
      template: { select: { id: true, name: true } },
      _count: { select: { reviews: true } },
    },
    orderBy: { startDate: "desc" },
  });
}

export async function getCycle(id: string) {
  const prisma = await getPrisma();
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id },
    include: {
      template: true,
      reviews: {
        include: {
          reviewee: { select: { id: true, employeeCode: true, firstNameTh: true, lastNameTh: true } },
          reviewer: { select: { id: true, employeeCode: true, firstNameTh: true, lastNameTh: true } },
        },
      },
    },
  });
  if (!cycle) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
  return cycle;
}

export async function createCycle(
  caller: Caller,
  input: ReviewCycleCreateInput,
  meta: RequestMeta,
) {
  const prisma = await getPrisma();
  const template = await prisma.reviewTemplate.findUnique({ where: { id: input.templateId } });
  if (!template) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, { entity: "ReviewTemplate" }, 404);

  const created = await prisma.reviewCycle.create({
    data: {
      name: input.name,
      cadence: input.cadence,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      templateId: input.templateId,
    },
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "review.cycle_created",
    entityType: "ReviewCycle",
    entityId: created.id,
    after: created,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return created;
}

/**
 * Activate a DRAFT cycle: create SELF + MANAGER reviews for every active
 * employee. Idempotent on (cycleId, revieweeId, reviewerId).
 */
export async function activateCycle(
  caller: Caller,
  cycleId: string,
  meta: RequestMeta,
) {
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const cycle = await tx.reviewCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (cycle.status !== "DRAFT") {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED, { status: cycle.status });
    }

    const employees = await tx.employee.findMany({
      where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] }, isAnonymized: false },
      select: { id: true, managerId: true },
    });

    let created = 0;
    for (const emp of employees) {
      // Self review
      await tx.review.upsert({
        where: { cycleId_revieweeId_reviewerId: { cycleId, revieweeId: emp.id, reviewerId: emp.id } },
        create: { cycleId, revieweeId: emp.id, reviewerId: emp.id, reviewType: "SELF" },
        update: {},
      });
      created++;
      // Manager review
      if (emp.managerId) {
        await tx.review.upsert({
          where: { cycleId_revieweeId_reviewerId: { cycleId, revieweeId: emp.id, reviewerId: emp.managerId } },
          create: { cycleId, revieweeId: emp.id, reviewerId: emp.managerId, reviewType: "MANAGER" },
          update: {},
        });
        created++;
      }
    }

    const updated = await tx.reviewCycle.update({
      where: { id: cycleId },
      data: { status: "ACTIVE" },
    });

    await writeAuditLog({
      actorId: caller.userId,
      action: "review.cycle_activated",
      entityType: "ReviewCycle",
      entityId: cycleId,
      before: cycle,
      after: { ...updated, reviewsCreated: created },
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return { cycle: updated, reviewsCreated: created };
  });
}

export async function closeCycle(caller: Caller, cycleId: string, meta: RequestMeta) {
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const cycle = await tx.reviewCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (cycle.status !== "ACTIVE") {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED, { status: cycle.status });
    }

    const updated = await tx.reviewCycle.update({
      where: { id: cycleId },
      data: { status: "CLOSED" },
    });

    await writeAuditLog({
      actorId: caller.userId,
      action: "review.cycle_closed",
      entityType: "ReviewCycle",
      entityId: cycleId,
      before: cycle,
      after: updated,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return updated;
  });
}
