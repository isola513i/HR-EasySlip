import type { PrismaClient } from "@prisma/client";
import type { EmployeeRecord } from "./employees";

export async function seedAnnualLeaveCashOut(
  prisma: PrismaClient,
  employeeMap: Map<string, EmployeeRecord>,
): Promise<number> {
  // Year-end 2025 cashouts + resignation cashout for ES0018
  const cashouts = [
    // Suda: 6 days allocated, used 2 → 4 days year-end cashout
    { code: "ES0011", year: 2025, unusedDays: 4.0, trigger: "YEAR_END" as const, status: "EXPORTED" as const, exportedAt: new Date("2026-01-03T09:00:00Z") },
    // Nattapol: 6 days allocated, used 3.5 → 2.5 days year-end cashout
    { code: "ES0012", year: 2025, unusedDays: 2.5, trigger: "YEAR_END" as const, status: "EXPORTED" as const, exportedAt: new Date("2026-01-03T09:00:00Z") },
    // ES0018 (resigned 2026-03-31): prorated annual leave → 1.5 days cashout, pending export
    { code: "ES0018", year: 2026, unusedDays: 1.5, trigger: "RESIGNATION" as const, status: "PENDING" as const, exportedAt: null },
  ];

  let count = 0;
  for (const c of cashouts) {
    const emp = employeeMap.get(c.code);
    if (!emp) continue;

    await prisma.annualLeaveCashOut.upsert({
      where: { employeeId_year: { employeeId: emp.id, year: c.year } },
      create: {
        employeeId: emp.id,
        year: c.year,
        unusedDays: c.unusedDays,
        trigger: c.trigger,
        exportStatus: c.status,
        exportedAt: c.exportedAt,
      },
      update: {},
    });
    count++;
  }

  return count;
}
