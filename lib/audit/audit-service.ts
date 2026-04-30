// ════════════════════════════════════════════════════════════════
// Audit Service — query logs and entity timelines
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import type { AuditQuery } from "./schemas";
import { categorizeAction, moduleForEntity, type AuditCategory } from "./categories";

const MODULE_ENTITIES: Record<string, string[]> = {
  EMPLOYEES: ["Employee", "LeaveQuota"],
  LEAVE: ["LeaveRequest"],
  ATTENDANCE: ["AttendanceRecord", "TimeAdjustmentRequest"],
  OVERTIME: ["OvertimeRequest"],
  PAYROLL: ["PayrollCycle", "PayrollOutboxEvent"],
  REPORTS: ["Report"],
  SETTINGS: ["User", "SystemConfig", "ConsentRecord"],
};

function buildWhere(filters: AuditQuery) {
  const moduleEntities = filters.module ? MODULE_ENTITIES[filters.module] : undefined;
  return {
    ...(filters.entityType && { entityType: filters.entityType }),
    ...(moduleEntities && moduleEntities.length > 0 && { entityType: { in: moduleEntities } }),
    ...(filters.actorId && { actorId: filters.actorId }),
    ...(filters.action && {
      OR: [
        { action: { contains: filters.action } },
        { entityType: { contains: filters.action } },
      ],
    }),
    ...((filters.from || filters.to) && {
      createdAt: {
        ...(filters.from && { gte: new Date(filters.from) }),
        ...(filters.to && { lte: new Date(filters.to + "T23:59:59.999Z") }),
      },
    }),
  };
}

export async function queryLogs(filters: AuditQuery) {
  const where = buildWhere(filters);

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.perPage,
      take: filters.perPage,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, total, page: filters.page, perPage: filters.perPage };
}

export async function getAuditSummary(filters: AuditQuery) {
  const where = buildWhere(filters);

  const [actions, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      select: { action: true, entityType: true },
    }),
    prisma.auditLog.count(),
  ]);

  const counts: Record<AuditCategory, number> = {
    CREATE: 0,
    UPDATE: 0,
    DELETE: 0,
    EXPORT: 0,
    OTHER: 0,
  };
  const moduleCounts: Record<string, number> = {};

  for (const a of actions) {
    counts[categorizeAction(a.action)] += 1;
    const m = moduleForEntity(a.entityType);
    moduleCounts[m] = (moduleCounts[m] ?? 0) + 1;
  }

  return {
    create: counts.CREATE,
    update: counts.UPDATE,
    delete: counts.DELETE,
    export: counts.EXPORT,
    other: counts.OTHER,
    rangeTotal: actions.length,
    grandTotal: total,
    moduleCounts,
  };
}

export async function getEntityTimeline(
  entityType: string,
  entityId: string,
  page = 1,
  perPage = 50,
) {
  const where = { entityType, entityId };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { actor: { select: { id: true, email: true } } },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, total, page, perPage };
}
