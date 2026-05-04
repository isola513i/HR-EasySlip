import type { PrismaClient } from "@prisma/client";

/** Cycle bounds match lib/system/cron-service.ts ensureUpcomingCycles(). */
function bounds(year: number, month: number, cutoffDay = 25) {
  const cycleStart = new Date(Date.UTC(month === 1 ? year - 1 : year, month === 1 ? 11 : month - 2, cutoffDay + 1));
  const cycleEnd = new Date(Date.UTC(year, month - 1, cutoffDay));
  const cutOffAt = new Date(Date.UTC(year, month - 1, cutoffDay, 16, 59, 59));
  return { cycleStart, cycleEnd, cutOffAt };
}

export async function seedPayrollCycle(prisma: PrismaClient) {
  // Historical (LOCKED) cycle for testing exports
  const mar = bounds(2026, 3);
  await prisma.payrollCycle.upsert({
    where: { year_month: { year: 2026, month: 3 } },
    create: {
      year: 2026, month: 3,
      cycleStart: mar.cycleStart, cycleEnd: mar.cycleEnd, cutOffAt: mar.cutOffAt,
      status: "LOCKED",
      lockedAt: new Date("2026-03-25T17:00:00.000Z"),
    },
    update: {},
  });

  // Open cycles for the current and next two months so dev environments
  // can submit clocks/leaves without first triggering the cron.
  const now = new Date();
  const bkk = new Date(now.getTime() + 7 * 3600_000);
  const startMonth = bkk.getUTCMonth() + 1; // 1-12
  const startYear = bkk.getUTCFullYear();

  for (let i = 0; i < 3; i++) {
    const m0 = startMonth - 1 + i;
    const year = startYear + Math.floor(m0 / 12);
    const month = (m0 % 12) + 1;
    const { cycleStart, cycleEnd, cutOffAt } = bounds(year, month);
    await prisma.payrollCycle.upsert({
      where: { year_month: { year, month } },
      create: { year, month, cycleStart, cycleEnd, cutOffAt, status: "OPEN" },
      update: {},
    });
  }
}
