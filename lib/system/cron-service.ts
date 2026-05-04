// ════════════════════════════════════════════════════════════════
// Cron Service — daily quota tick + auto cut-off lock
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { logger } from "@/lib/observability/logger";
import { grantAnniversaryLeave } from "@/lib/leave/leave-quota-grant-service";
import { alertOnExhaustedOutboxEvents } from "@/lib/system/outbox-service";
import { getSettingValue } from "@/lib/settings/settings-service";

export async function dailyQuotaTick() {
  const result = await grantAnniversaryLeave();

  // Fire-and-forget outbox alert
  alertOnExhaustedOutboxEvents().catch((err) =>
    logger.error("Failed to send outbox alert", { error: err?.message }),
  );

  return result;
}

export async function cutoffLock() {
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
  });

  return { locked: true, cycleId: cycle.id };
}

/**
 * Prune AuditLog rows older than the configured retention window.
 * Retention is read from the `pdpa.audit_log.retention_days` setting.
 * Writes a meta audit row recording how many were pruned.
 */
export async function pruneOldAuditLogs() {
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
  });

  return { retentionDays, cutoffDate: cutoff.toISOString(), deletedCount: result.count };
}
