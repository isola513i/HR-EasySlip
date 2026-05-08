// Pure-function payroll math for Empeo template export.
// Reuses OT multipliers from lib/overtime/ot-calculation.ts so any rate
// change lives in a single place.
import { Decimal } from "@prisma/client/runtime/library";
import type { EmploymentType } from "@prisma/client";
import { getOTRate } from "@/lib/overtime/ot-calculation";

const WORKING_DAYS_PER_MONTH = new Decimal(30);
const WORKING_HOURS_PER_DAY = new Decimal(8);

export function dailyRate(base: Decimal, type: EmploymentType): Decimal {
  if (type === "MONTHLY") return base.div(WORKING_DAYS_PER_MONTH);
  // DAILY/INTERN: baseSalary already represents one day of work
  return base;
}

export function hourlyRate(base: Decimal, type: EmploymentType): Decimal {
  return dailyRate(base, type).div(WORKING_HOURS_PER_DAY);
}

export function computeOtAmount(
  hours: Decimal,
  type: "WEEKDAY" | "HOLIDAY" | "HOLIDAY_WORK",
  hourly: Decimal,
): Decimal {
  return hours.mul(hourly).mul(getOTRate(type)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function computeLwpDeduction(days: Decimal, daily: Decimal): Decimal {
  return days.mul(daily).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function computeAbsentDeduction(days: Decimal, daily: Decimal): Decimal {
  return days.mul(daily).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function computeCashoutAmount(days: Decimal, daily: Decimal): Decimal {
  return days.mul(daily).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function salaryPerCycle(base: Decimal, type: EmploymentType): Decimal {
  // Empeo expects "เงินเดือนต่องวด" — the gross monthly figure for MONTHLY,
  // or daily × working-days for DAILY/INTERN. Keep as the base value as-is
  // for MONTHLY; HR fills in actual hours/days for DAILY/INTERN themselves.
  if (type === "MONTHLY") return base.toDecimalPlaces(2);
  return base.toDecimalPlaces(2);
}
