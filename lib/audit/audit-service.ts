// ════════════════════════════════════════════════════════════════
// Audit Service — query logs and entity timelines
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import type { AuditQuery } from "./schemas";

export async function queryLogs(filters: AuditQuery) {
  const where = {
    ...(filters.entityType && { entityType: filters.entityType }),
    ...(filters.actorId && { actorId: filters.actorId }),
    ...(filters.action && { action: { contains: filters.action } }),
    ...((filters.from || filters.to) && {
      createdAt: {
        ...(filters.from && { gte: new Date(filters.from) }),
        ...(filters.to && { lte: new Date(filters.to + "T23:59:59.999Z") }),
      },
    }),
  };

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

export async function getEntityTimeline(
  entityType: string,
  entityId: string,
) {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    include: {
      actor: { select: { id: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
