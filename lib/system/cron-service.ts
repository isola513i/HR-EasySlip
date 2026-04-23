// ════════════════════════════════════════════════════════════════
// Cron Service — daily quota tick + auto cut-off lock
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { logger } from "@/lib/observability/logger";
import { grantAnniversaryLeave } from "@/lib/leave/leave-quota-grant-service";
import { alertOnExhaustedOutboxEvents } from "@/lib/system/outbox-service";

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

  // Only auto-lock on the 25th (or later if missed)
  if (day < 25) {
    return { locked: false, reason: "Not yet 25th" };
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
