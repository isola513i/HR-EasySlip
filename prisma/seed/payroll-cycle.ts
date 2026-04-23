import type { PrismaClient } from "@prisma/client";

export async function seedPayrollCycle(prisma: PrismaClient) {
  await prisma.payrollCycle.upsert({
    where: { year_month: { year: 2026, month: 4 } },
    create: {
      year: 2026,
      month: 4,
      cycleStart: new Date("2026-03-26"),
      cycleEnd: new Date("2026-04-25"),
      cutOffAt: new Date("2026-04-25T16:59:59.000Z"), // 23:59:59 Bangkok
      status: "OPEN",
    },
    update: {},
  });

  // Also seed March (already closed) for historical data
  await prisma.payrollCycle.upsert({
    where: { year_month: { year: 2026, month: 3 } },
    create: {
      year: 2026,
      month: 3,
      cycleStart: new Date("2026-02-26"),
      cycleEnd: new Date("2026-03-25"),
      cutOffAt: new Date("2026-03-25T16:59:59.000Z"),
      status: "LOCKED",
      lockedAt: new Date("2026-03-25T17:00:00.000Z"),
    },
    update: {},
  });
}
