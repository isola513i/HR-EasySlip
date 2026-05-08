// Aggregates per-employee per-cycle payroll figures used by the Empeo
// Excel template exporter. Pulls from OvertimeRequest / LeaveRequest /
// AttendanceRecord / AnnualLeaveCashOut / ExpenseClaim and converts to
// baht via empeo-amounts helpers.
import { Decimal } from "@prisma/client/runtime/library";
import type { EmploymentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import {
  computeAbsentDeduction,
  computeCashoutAmount,
  computeLwpDeduction,
  computeOtAmount,
  dailyRate,
  hourlyRate,
  salaryPerCycle,
} from "./empeo-amounts";

const ZERO = new Decimal(0);

export interface EmpeoEmployeeRow {
  employeeCode: string;
  fullNameTh: string;
  company: string;
  level: string;
  employmentType: EmploymentType | null;
  // Income (THB)
  salaryPerCycle: Decimal | null;
  otWeekday: Decimal;
  otHoliday: Decimal;
  otHolidayWork: Decimal;
  expenseReimburse: Decimal;
  cashoutAmount: Decimal;
  // Deductions (THB, positive number)
  lwpDeduction: Decimal;
  absentDeduction: Decimal;
}

export interface PeriodAggregation {
  cycleId: string;
  year: number;
  month: number;
  cycleStart: Date;
  cycleEnd: Date;
  rows: EmpeoEmployeeRow[];
}

type EmpRow = {
  id: string;
  employeeCode: string;
  firstNameTh: string;
  lastNameTh: string;
  employmentType: EmploymentType | null;
  baseSalary: Decimal | null;
  position: { name: string } | null;
  department: { name: string } | null;
};

async function getOtHoursByType(
  cycleId: string,
): Promise<Map<string, { weekday: Decimal; holiday: Decimal; holidayWork: Decimal }>> {
  const rows = await prisma.overtimeRequest.findMany({
    where: { status: "APPROVED", payrollCycleId: cycleId },
    select: { employeeId: true, overtimeType: true, hoursApproved: true },
  });
  const map = new Map<string, { weekday: Decimal; holiday: Decimal; holidayWork: Decimal }>();
  for (const r of rows) {
    const cur = map.get(r.employeeId) ?? { weekday: ZERO, holiday: ZERO, holidayWork: ZERO };
    const h = r.hoursApproved ?? ZERO;
    if (r.overtimeType === "WEEKDAY") cur.weekday = cur.weekday.plus(h);
    else if (r.overtimeType === "HOLIDAY") cur.holiday = cur.holiday.plus(h);
    else if (r.overtimeType === "HOLIDAY_WORK") cur.holidayWork = cur.holidayWork.plus(h);
    map.set(r.employeeId, cur);
  }
  return map;
}

async function getLwpDays(cycleId: string): Promise<Map<string, Decimal>> {
  const rows = await prisma.leaveRequest.findMany({
    where: { leaveType: "LEAVE_WITHOUT_PAY", status: "APPROVED", payrollCycleId: cycleId },
    select: { employeeId: true, daysRequested: true },
  });
  const map = new Map<string, Decimal>();
  for (const r of rows) {
    map.set(r.employeeId, (map.get(r.employeeId) ?? ZERO).plus(r.daysRequested));
  }
  return map;
}

async function getCashoutDays(year: number): Promise<Map<string, Decimal>> {
  const rows = await prisma.annualLeaveCashOut.findMany({
    where: { year, exportStatus: "PENDING" },
    select: { employeeId: true, unusedDays: true },
  });
  return new Map(rows.map((r) => [r.employeeId, r.unusedDays]));
}

async function getExpenseAmounts(cycleId: string): Promise<Map<string, Decimal>> {
  const rows = await prisma.expenseClaim.findMany({
    where: { status: "APPROVED", payrollCycleId: cycleId },
    select: { employeeId: true, amountTHB: true },
  });
  const map = new Map<string, Decimal>();
  for (const r of rows) {
    map.set(r.employeeId, (map.get(r.employeeId) ?? ZERO).plus(r.amountTHB));
  }
  return map;
}

async function getAbsentDays(
  cycleStart: Date,
  cycleEnd: Date,
  employees: readonly EmpRow[],
): Promise<Map<string, Decimal>> {
  // Lazy: count days between cycleStart..cycleEnd where the employee has
  // no IN clock and isn't on approved leave / public holiday. To stay
  // O(N) and avoid per-day classifier calls (this is only used for Empeo
  // reconciliation, not the live dashboard), reuse already-loaded data
  // from a single bulk fetch.
  const empIds = employees.map((e) => e.id);
  if (empIds.length === 0) return new Map();

  const [attendance, leaves, holidays] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { employeeId: { in: empIds }, clockType: "IN", clockedAt: { gte: cycleStart, lte: cycleEnd } },
      select: { employeeId: true, clockedAt: true },
    }),
    prisma.leaveRequest.findMany({
      where: { employeeId: { in: empIds }, status: "APPROVED",
        startDate: { lte: cycleEnd }, endDate: { gte: cycleStart } },
      select: { employeeId: true, startDate: true, endDate: true },
    }),
    prisma.publicHoliday.findMany({
      where: { date: { gte: cycleStart, lte: cycleEnd } },
      select: { date: true },
    }),
  ]);

  const holidaySet = new Set(holidays.map((h) => isoDate(h.date)));
  const inDaysByEmp = new Map<string, Set<string>>();
  for (const a of attendance) {
    const set = inDaysByEmp.get(a.employeeId) ?? new Set<string>();
    set.add(isoDate(a.clockedAt));
    inDaysByEmp.set(a.employeeId, set);
  }
  const leavesByEmp = new Map<string, { start: string; end: string }[]>();
  for (const l of leaves) {
    const list = leavesByEmp.get(l.employeeId) ?? [];
    list.push({ start: isoDate(l.startDate), end: isoDate(l.endDate) });
    leavesByEmp.set(l.employeeId, list);
  }

  const out = new Map<string, Decimal>();
  for (const emp of employees) {
    let absent = 0;
    const inDays = inDaysByEmp.get(emp.id) ?? new Set();
    const onLeave = leavesByEmp.get(emp.id) ?? [];
    for (let d = new Date(cycleStart); d <= cycleEnd; d.setUTCDate(d.getUTCDate() + 1)) {
      const iso = isoDate(d);
      const day = d.getUTCDay();
      if (day === 0 || day === 6) continue; // weekend
      if (holidaySet.has(iso)) continue;
      if (inDays.has(iso)) continue;
      if (onLeave.some((l) => iso >= l.start && iso <= l.end)) continue;
      absent++;
    }
    if (absent > 0) out.set(emp.id, new Decimal(absent));
  }
  return out;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function aggregatePeriod(cycleId: string): Promise<PeriodAggregation> {
  const cycle = await prisma.payrollCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);

  const employees = await prisma.employee.findMany({
    where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] }, isAnonymized: false },
    select: {
      id: true, employeeCode: true, firstNameTh: true, lastNameTh: true,
      employmentType: true, baseSalary: true,
      position: { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: { employeeCode: "asc" },
  });

  const [otMap, lwpMap, cashoutMap, expenseMap, absentMap] = await Promise.all([
    getOtHoursByType(cycleId),
    getLwpDays(cycleId),
    getCashoutDays(cycle.year),
    getExpenseAmounts(cycleId),
    getAbsentDays(cycle.cycleStart, cycle.cycleEnd, employees),
  ]);

  const company = process.env.NEXT_PUBLIC_APP_NAME ?? "EasySlip HR";

  const rows: EmpeoEmployeeRow[] = employees.map((emp) => {
    const type = emp.employmentType;
    const base = emp.baseSalary;
    const ot = otMap.get(emp.id) ?? { weekday: ZERO, holiday: ZERO, holidayWork: ZERO };
    const lwpDays = lwpMap.get(emp.id) ?? ZERO;
    const absentDays = absentMap.get(emp.id) ?? ZERO;
    const cashoutDays = cashoutMap.get(emp.id) ?? ZERO;
    const expense = expenseMap.get(emp.id) ?? ZERO;

    if (!type || !base) {
      // No salary set — emit row with zeros so HR sees the employee but
      // can spot the missing baseSalary in the export.
      return {
        employeeCode: emp.employeeCode,
        fullNameTh: `${emp.firstNameTh} ${emp.lastNameTh}`,
        company,
        level: emp.position?.name ?? "",
        employmentType: type,
        salaryPerCycle: null,
        otWeekday: ZERO, otHoliday: ZERO, otHolidayWork: ZERO,
        expenseReimburse: expense,
        cashoutAmount: ZERO,
        lwpDeduction: ZERO, absentDeduction: ZERO,
      };
    }

    const hourly = hourlyRate(base, type);
    const daily = dailyRate(base, type);

    return {
      employeeCode: emp.employeeCode,
      fullNameTh: `${emp.firstNameTh} ${emp.lastNameTh}`,
      company,
      level: emp.position?.name ?? "",
      employmentType: type,
      salaryPerCycle: salaryPerCycle(base, type),
      otWeekday: computeOtAmount(ot.weekday, "WEEKDAY", hourly),
      otHoliday: computeOtAmount(ot.holiday, "HOLIDAY", hourly),
      otHolidayWork: computeOtAmount(ot.holidayWork, "HOLIDAY_WORK", hourly),
      expenseReimburse: expense,
      cashoutAmount: computeCashoutAmount(cashoutDays, daily),
      lwpDeduction: computeLwpDeduction(lwpDays, daily),
      absentDeduction: computeAbsentDeduction(absentDays, daily),
    };
  });

  return { cycleId, year: cycle.year, month: cycle.month, cycleStart: cycle.cycleStart, cycleEnd: cycle.cycleEnd, rows };
}
