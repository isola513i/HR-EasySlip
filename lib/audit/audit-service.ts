// ════════════════════════════════════════════════════════════════
// Audit Service — query logs and entity timelines
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import type { AuditQuery } from "./schemas";
import { categorizeAction, moduleForEntity, type AuditCategory } from "./categories";
import { ACTION_LABELS_EN, ACTION_LABELS_TH } from "./action-labels";

const MODULE_ENTITIES: Record<string, string[]> = {
  EMPLOYEES: ["Employee", "LeaveQuota"],
  LEAVE: ["LeaveRequest"],
  ATTENDANCE: ["AttendanceRecord", "TimeAdjustmentRequest"],
  OVERTIME: ["OvertimeRequest"],
  PAYROLL: ["PayrollCycle", "PayrollOutboxEvent"],
  REPORTS: ["Report"],
  SETTINGS: ["User", "SystemConfig", "ConsentRecord"],
};

const KNOWN_ENTITIES = Object.values(MODULE_ENTITIES).flat();

function actionsMatchingLabel(query: string): string[] {
  const q = query.toLowerCase();
  const matches = new Set<string>();
  for (const [code, label] of Object.entries(ACTION_LABELS_EN)) {
    if (label.toLowerCase().includes(q)) matches.add(code);
  }
  for (const [code, label] of Object.entries(ACTION_LABELS_TH)) {
    if (label.toLowerCase().includes(q)) matches.add(code);
  }
  return [...matches];
}

function buildWhere(filters: AuditQuery) {
  const where: Record<string, unknown> = {};

  if (filters.entityType) where.entityType = filters.entityType;

  if (filters.module === "OTHER") {
    where.entityType = { notIn: KNOWN_ENTITIES };
  } else if (filters.module) {
    const moduleEntities = MODULE_ENTITIES[filters.module];
    if (moduleEntities?.length) where.entityType = { in: moduleEntities };
  }

  if (filters.actorId) where.actorId = filters.actorId;
  if (filters.actorType) where.actorType = filters.actorType;

  if (filters.action) {
    const q = filters.action;
    const labelMatches = actionsMatchingLabel(q);
    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { entityType: { contains: q, mode: "insensitive" } },
      ...(labelMatches.length > 0 ? [{ action: { in: labelMatches } }] : []),
    ];
  }

  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from && { gte: new Date(filters.from) }),
      ...(filters.to && { lte: new Date(filters.to + "T23:59:59.999Z") }),
    };
  }

  return where;
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
