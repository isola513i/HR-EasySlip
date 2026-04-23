import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { computeAnnualLeaveGrant } from "./annual-quota-engine";

type TxClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Grant initial SICK (30d) + PERSONAL (3d) quota for a new employee.
 * Thai law: พนักงานวันแรกต้องได้ลาป่วย 30 วัน + ลากิจ 3 วัน
 * Idempotent: uses upsert — safe to call multiple times.
 */
export async function grantInitialLeaveQuota(
  employeeId: string,
  hireDate: Date,
  tx?: TxClient,
): Promise<void> {
  const client = tx ?? prisma;
  const quotaYear = hireDate.getFullYear();

  const grants: { leaveType: "SICK" | "PERSONAL"; days: number }[] = [
    { leaveType: "SICK", days: 30 },
    { leaveType: "PERSONAL", days: 3 },
  ];

  for (const g of grants) {
    await client.leaveQuota.upsert({
      where: {
        employeeId_leaveType_quotaYear: { employeeId, leaveType: g.leaveType, quotaYear },
      },
      create: {
        employeeId,
        leaveType: g.leaveType,
        quotaYear,
        eligibleFrom: hireDate,
        allocatedDays: g.days,
      },
      update: {},
    });
  }
}

export async function resetYearEnd(year: number) {
  const quotas = await prisma.leaveQuota.findMany({
    where: { leaveType: "ANNUAL", quotaYear: year },
    include: { employee: { select: { id: true } } },
  });

  const cashOuts = [];
  for (const q of quotas) {
    const unused = q.allocatedDays.minus(q.usedDays).minus(q.pendingDays);
    if (unused.gt(0)) {
      const cashOut = await prisma.annualLeaveCashOut.upsert({
        where: { employeeId_year: { employeeId: q.employeeId, year } },
        create: { employeeId: q.employeeId, year, unusedDays: unused, trigger: "YEAR_END" },
        update: { unusedDays: unused },
      });
      cashOuts.push(cashOut);
    }
  }

  await writeAuditLog({
    actorId: null,
    action: "leave.year_end_reset",
    entityType: "LeaveQuota",
    entityId: `year-${year}`,
    after: { quotasProcessed: quotas.length, cashOutsCreated: cashOuts.length },
  });

  return { quotasProcessed: quotas.length, cashOutsCreated: cashOuts.length };
}

export async function grantAnniversaryLeave() {
  const today = new Date();
  const employees = await prisma.employee.findMany({
    where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] } },
    select: { id: true, hireDate: true },
  });

  // Batch fetch existing ANNUAL quotas to avoid N+1
  const existingQuotas = await prisma.leaveQuota.findMany({
    where: {
      leaveType: "ANNUAL",
      quotaYear: today.getFullYear(),
      employeeId: { in: employees.map((e) => e.id) },
    },
  });
  const quotaMap = new Map(existingQuotas.map((q) => [q.employeeId, q]));

  let granted = 0;
  for (const emp of employees) {
    const existing = quotaMap.get(emp.id) ?? null;
    const result = computeAnnualLeaveGrant(emp.hireDate, today, existing);
    if (result.action === "NONE") continue;

    await prisma.leaveQuota.upsert({
      where: {
        employeeId_leaveType_quotaYear: { employeeId: emp.id, leaveType: "ANNUAL", quotaYear: today.getFullYear() },
      },
      create: {
        employeeId: emp.id, leaveType: "ANNUAL", quotaYear: today.getFullYear(),
        eligibleFrom: result.eligibleFrom, allocatedDays: result.days,
        isProrated: result.action === "GRANT_PRORATED",
        prorateBasis: "basis" in result ? result.basis : undefined,
      },
      update: {},
    });
    granted++;
  }

  // Safety net: grant initial SICK + PERSONAL for employees missing them
  let initialGranted = 0;
  const newHires = await prisma.employee.findMany({
    where: {
      employmentStatus: { in: ["ACTIVE", "PROBATION"] },
      leaveQuotas: { none: { leaveType: "SICK", quotaYear: today.getFullYear() } },
    },
    select: { id: true, hireDate: true },
  });
  for (const emp of newHires) {
    await grantInitialLeaveQuota(emp.id, emp.hireDate);
    initialGranted++;
  }

  await writeAuditLog({
    actorId: null,
    action: "leave.anniversary_grant",
    entityType: "LeaveQuota",
    entityId: `year-${today.getFullYear()}`,
    after: { employeesChecked: employees.length, granted, initialGranted },
  });

  return { employeesChecked: employees.length, granted, initialGranted };
}
