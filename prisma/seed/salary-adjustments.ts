import type { PrismaClient } from "@prisma/client";
import type { EmployeeRecord } from "./employees";

type AdjustmentDef = {
  type: "RAISE" | "PROMOTION" | "CORRECTION";
  date: string;
  after: number;
  note?: string;
};

type SalaryData = {
  code: string;
  initial: number;
  initialDate: string;
  adjustments?: AdjustmentDef[];
};

const SALARY_DATA: SalaryData[] = [
  { code: "ES0001", initial: 150000, initialDate: "2018-01-15" },
  { code: "ES0002", initial: 130000, initialDate: "2018-03-01" },
  { code: "ES0003", initial: 120000, initialDate: "2019-05-20" },
  {
    code: "ES0004",
    initial: 85000,
    initialDate: "2020-02-10",
    adjustments: [{ type: "RAISE", date: "2024-01-01", after: 92000, note: "ขึ้นเงินเดือนประจำปี 2024" }],
  },
  { code: "ES0005", initial: 55000, initialDate: "2022-09-01" },
  {
    code: "ES0006",
    initial: 88000,
    initialDate: "2019-08-12",
    adjustments: [{ type: "RAISE", date: "2023-01-01", after: 95000, note: "ขึ้นเงินเดือนประจำปี 2023" }],
  },
  { code: "ES0007", initial: 80000, initialDate: "2020-06-01" },
  { code: "ES0008", initial: 78000, initialDate: "2021-04-15" },
  { code: "ES0009", initial: 82000, initialDate: "2020-11-20" },
  { code: "ES0010", initial: 32000, initialDate: "2025-06-03" },
  {
    code: "ES0011",
    initial: 62000,
    initialDate: "2022-03-15",
    adjustments: [
      { type: "RAISE", date: "2023-04-01", after: 68000, note: "ปรับตามผลประเมิน Q4/2022 (4★)" },
      { type: "PROMOTION", date: "2025-01-01", after: 75000, note: "เลื่อนตำแหน่ง Senior SE" },
    ],
  },
  {
    code: "ES0012",
    initial: 52000,
    initialDate: "2021-07-01",
    adjustments: [{ type: "RAISE", date: "2024-01-01", after: 60000, note: "ขึ้นเงินเดือนประจำปี 2024" }],
  },
  { code: "ES0013", initial: 58000, initialDate: "2020-11-03" },
  { code: "ES0014", initial: 42000, initialDate: "2023-01-10" },
  { code: "ES0015", initial: 28000, initialDate: "2026-02-20" },
  {
    code: "ES0017",
    initial: 82000,
    initialDate: "2021-09-01",
    adjustments: [{ type: "RAISE", date: "2024-07-01", after: 90000, note: "ขึ้นเงินเดือน mid-year 2024" }],
  },
  { code: "ES0018", initial: 58000, initialDate: "2022-05-15" },
];

export async function seedSalaryAdjustments(
  prisma: PrismaClient,
  employeeMap: Map<string, EmployeeRecord>,
  hrmgUserId: string,
): Promise<number> {
  let count = 0;

  for (const data of SALARY_DATA) {
    const emp = employeeMap.get(data.code);
    if (!emp) continue;

    await prisma.salaryAdjustment.deleteMany({ where: { employeeId: emp.id } });

    await prisma.salaryAdjustment.create({
      data: {
        employeeId: emp.id,
        effectiveDate: new Date(data.initialDate),
        adjustmentType: "INITIAL",
        salaryBefore: null,
        salaryAfter: data.initial,
        ratePct: null,
        note: "Initial salary on hire",
        actorId: hrmgUserId,
      },
    });
    count++;

    let prev = data.initial;
    for (const adj of data.adjustments ?? []) {
      const ratePct = Math.round(((adj.after - prev) / prev) * 10000) / 100;
      await prisma.salaryAdjustment.create({
        data: {
          employeeId: emp.id,
          effectiveDate: new Date(adj.date),
          adjustmentType: adj.type,
          salaryBefore: prev,
          salaryAfter: adj.after,
          ratePct,
          note: adj.note,
          actorId: hrmgUserId,
        },
      });
      prev = adj.after;
      count++;
    }

    await prisma.employee.update({
      where: { id: emp.id },
      data: { baseSalary: prev, employmentType: "MONTHLY" },
    });
  }

  return count;
}
