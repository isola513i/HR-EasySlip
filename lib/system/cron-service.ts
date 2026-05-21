// ════════════════════════════════════════════════════════════════
// Cron Service — daily quota tick + auto cut-off lock
// ════════════════════════════════════════════════════════════════

import type { PrismaClient } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit/logger";
import { logger } from "@/lib/observability/logger";
import { grantAnniversaryLeave } from "@/lib/leave/leave-quota-grant-service";
import { alertOnExhaustedOutboxEvents } from "@/lib/system/outbox-service";
import { getSettingValue } from "@/lib/settings/settings-service";

export async function dailyQuotaTick(prisma: PrismaClient) {
  const result = await grantAnniversaryLeave();

  // Ensure the current + next cycles exist so leave / clock submissions
  // never bounce with NO_CYCLE on the first business day of a new month.
  const cycles = await ensureUpcomingCycles(prisma).catch((err) => {
    logger.error("Failed to ensure cycles", { error: err?.message });
    return null;
  });

  // Fire-and-forget outbox alert
  alertOnExhaustedOutboxEvents().catch((err) =>
    logger.error("Failed to send outbox alert", { error: err?.message }),
  );

  // Weekly audit prune — Sunday in Bangkok time. Folded into the daily
  // tick so we stay within the 2-cron limit on Vercel Hobby plan; the
  // prune itself is idempotent when retention is satisfied.
  const bkk = new Date(Date.now() + 7 * 3600_000);
  let pruned: number | null = null;
  if (bkk.getUTCDay() === 0) {
    const r = await pruneOldAuditLogs(prisma).catch((err) => {
      logger.error("Failed to prune audit logs", { error: err?.message });
      return null;
    });
    pruned = r?.deletedCount ?? null;
  }

  return { ...result, cyclesEnsured: cycles?.created ?? 0, pruned };
}

/** Build (year, month) for current month and next month based on Bangkok wall-clock. */
function thisAndNextMonth(now = new Date()): Array<{ year: number; month: number }> {
  const bkk = new Date(now.getTime() + 7 * 3600_000);
  const y = bkk.getUTCFullYear();
  const m = bkk.getUTCMonth() + 1; // 1-12
  const next = m === 12 ? { year: y + 1, month: 1 } : { year: y, month: m + 1 };
  return [{ year: y, month: m }, next];
}

/** Cycle bounds: cycleStart = previous month's (cutoffDay+1); cycleEnd = current month's cutoffDay. */
function cycleBounds(year: number, month: number, cutoffDay: number) {
  const cycleStart = new Date(Date.UTC(month === 1 ? year - 1 : year, month === 1 ? 11 : month - 2, cutoffDay + 1));
  const cycleEnd = new Date(Date.UTC(year, month - 1, cutoffDay));
  // 23:59:59 Bangkok = 16:59:59 UTC of cycleEnd
  const cutOffAt = new Date(Date.UTC(year, month - 1, cutoffDay, 16, 59, 59));
  return { cycleStart, cycleEnd, cutOffAt };
}

/** Idempotently create OPEN cycles for the current and next calendar months. */
export async function ensureUpcomingCycles(prisma: PrismaClient) {
  const cutoffDay = await getSettingValue<number>("payroll.cutoff.day_of_month");
  const months = thisAndNextMonth();
  let created = 0;
  for (const { year, month } of months) {
    const existing = await prisma.payrollCycle.findUnique({
      where: { year_month: { year, month } },
      select: { id: true },
    });
    if (existing) continue;
    const { cycleStart, cycleEnd, cutOffAt } = cycleBounds(year, month, cutoffDay);
    await prisma.payrollCycle.create({
      data: { year, month, cycleStart, cycleEnd, cutOffAt, status: "OPEN" },
    });
    created++;
  }
  return { created, months };
}

export async function cutoffLock(prisma: PrismaClient) {
  const now = new Date();
  const day = now.getDate();
  const cutoffDay = await getSettingValue<number>("payroll.cutoff.day_of_month");

  // Only auto-lock on the configured cutoff day (or later if missed)
  if (day < cutoffDay) {
    return { locked: false, reason: `Not yet ${cutoffDay}th` };
  }

  const cycle = await prisma.payrollCycle.findFirst({
    where: {
      status: "OPEN",
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    },
  });

  if (!cycle) {
    return { locked: false, reason: "No open cycle for current month" };
  }

  const updated = await prisma.payrollCycle.update({
    where: { id: cycle.id },
    data: { status: "LOCKED", lockedAt: now, lockedBy: "system-cron" },
  });

  await writeAuditLog({
    actorId: null,
    action: "payroll.auto_cutoff_lock",
    entityType: "PayrollCycle",
    entityId: cycle.id,
    before: cycle,
    after: updated,
  }, prisma);

  return { locked: true, cycleId: cycle.id };
}

/**
 * Prune AuditLog rows older than the configured retention window.
 * Retention is read from the `pdpa.audit_log.retention_days` setting.
 * Writes a meta audit row recording how many were pruned.
 */
export async function pruneOldAuditLogs(prisma: PrismaClient) {
  const retentionDays = await getSettingValue<number>("pdpa.audit_log.retention_days");
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - retentionDays);

  const before = await prisma.auditLog.count({ where: { createdAt: { lt: cutoff } } });
  const result = await prisma.auditLog.deleteMany({ where: { createdAt: { lt: cutoff } } });

  await writeAuditLog({
    actorId: null,
    action: "audit.prune",
    entityType: "AuditLog",
    entityId: `cutoff-${cutoff.toISOString().slice(0, 10)}`,
    after: {
      retentionDays,
      cutoffDate: cutoff.toISOString(),
      candidateCount: before,
      deletedCount: result.count,
    },
  }, prisma);

  return { retentionDays, cutoffDate: cutoff.toISOString(), deletedCount: result.count };
}
