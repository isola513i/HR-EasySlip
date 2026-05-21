import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { computeAnnualLeaveGrant } from "./annual-quota-engine";
import { loadLeavePolicy } from "./policy";

type TxClient = Prisma.TransactionClient;

/**
 * Grant initial leave quotas for a new employee. Thai law: พนักงานวันแรก
 * ต้องได้ ลาป่วย 30 / ลากิจ 3. We also seed yearly-renewable types (CHILD_CARE,
 * FUNERAL, TRAINING, PATERNITY) so the UI can surface meaningful balances.
 * MATERNITY / ORDINATION / MILITARY are event-driven (once-in-event) — HR
 * grants those manually via the quota adjust UI when triggered.
 *
 * Idempotent: uses upsert — safe to call multiple times.
 */
export async function grantInitialLeaveQuota(
  employeeId: string,
  hireDate: Date,
  tx?: TxClient,
  quotaYearOverride?: number,
): Promise<void> {
  const client = tx ?? (await getPrisma());
  const quotaYear = quotaYearOverride ?? hireDate.getFullYear();
  const policy = await loadLeavePolicy();

  const grants: { leaveType: "SICK" | "PERSONAL" | "CHILD_CARE" | "FUNERAL" | "TRAINING" | "PATERNITY"; days: number }[] = [
    { leaveType: "SICK", days: policy.sickMaxPaidDays },
    { leaveType: "PERSONAL", days: policy.personalMaxDays },
    { leaveType: "CHILD_CARE", days: policy.childCareDays },
    { leaveType: "FUNERAL", days: policy.funeralDays },
    { leaveType: "TRAINING", days: policy.trainingDays },
    { leaveType: "PATERNITY", days: policy.paternityDays },
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
  const prisma = await getPrisma();
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
  const prisma = await getPrisma();
  const today = new Date();
  const [employees, policy] = await Promise.all([
    prisma.employee.findMany({
      where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] } },
      select: { id: true, hireDate: true },
    }),
    loadLeavePolicy(),
  ]);

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
    const result = computeAnnualLeaveGrant(emp.hireDate, today, existing, policy.annual);
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

  // Safety net: backfill any missing initial-grant types for current year.
  // grantInitialLeaveQuota is idempotent (upsert), so this is safe to run for
  // both new hires and existing employees missing the new types added in
  // Phase 3 (CHILD_CARE, FUNERAL, TRAINING, PATERNITY).
  let initialGranted = 0;
  const initialGrantTypes = ["SICK", "PERSONAL", "CHILD_CARE", "FUNERAL", "TRAINING", "PATERNITY"] as const;
  const employeesNeedingBackfill = await prisma.employee.findMany({
    where: {
      employmentStatus: { in: ["ACTIVE", "PROBATION"] },
      OR: initialGrantTypes.map((t) => ({
        leaveQuotas: { none: { leaveType: t, quotaYear: today.getFullYear() } },
      })),
    },
    select: { id: true, hireDate: true },
  });
  for (const emp of employeesNeedingBackfill) {
    await grantInitialLeaveQuota(emp.id, emp.hireDate, undefined, today.getFullYear());
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
