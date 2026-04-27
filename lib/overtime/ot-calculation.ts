import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";

export const WORK_END_HOUR = 18; // 18:00 Bangkok time
const MIN_OT_MINUTES = 30;
const ROUND_STEP_MINUTES = 30;
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Convert UTC Date to Bangkok hours+minutes */
function toBangkokHM(d: Date): { h: number; m: number } {
  const bkk = new Date(d.getTime() + BANGKOK_OFFSET_MS);
  return { h: bkk.getUTCHours(), m: bkk.getUTCMinutes() };
}

/** Round down to nearest 30-minute step */
export function roundDown30(minutes: number): number {
  return Math.floor(minutes / ROUND_STEP_MINUTES) * ROUND_STEP_MINUTES;
}

/**
 * Calculate weekday OT hours from clock-out time.
 * OT starts at 18:00. Must be ≥30 min. Rounded down to 30-min step.
 * Returns null if <30 min (not eligible).
 */
export function calculateWeekdayOT(clockOut: Date): Decimal | null {
  const bkk = toBangkokHM(clockOut);
  const otMinutes = (bkk.h * 60 + bkk.m) - (WORK_END_HOUR * 60);
  if (otMinutes < MIN_OT_MINUTES) return null;

  const rounded = roundDown30(otMinutes);
  return new Decimal(rounded).div(60);
}

/**
 * Calculate holiday OT hours from assigned window vs actual scan.
 * effectiveStart = max(assignedStart, actualIn)
 * effectiveEnd = min(assignedEnd, actualOut)
 * Rounded down to 30-min step.
 */
export function calculateHolidayOT(
  assignedStart: Date,
  assignedEnd: Date,
  actualIn: Date,
  actualOut: Date,
): Decimal | null {
  const effectiveStart = actualIn > assignedStart ? actualIn : assignedStart;
  const effectiveEnd = actualOut < assignedEnd ? actualOut : assignedEnd;

  const diffMs = effectiveEnd.getTime() - effectiveStart.getTime();
  if (diffMs <= 0) return null;

  const totalMinutes = Math.floor(diffMs / 60_000);
  if (totalMinutes < MIN_OT_MINUTES) return null;

  const rounded = roundDown30(totalMinutes);
  return new Decimal(rounded).div(60);
}

/** Get rate multiplier by overtime type */
export function getOTRate(type: "WEEKDAY" | "HOLIDAY" | "HOLIDAY_WORK"): Decimal {
  switch (type) {
    case "WEEKDAY": return new Decimal("1.5");
    case "HOLIDAY": return new Decimal("3.0");
    case "HOLIDAY_WORK": return new Decimal("1.0");
  }
}

// Thai Labor Protection Act limits
const MAX_DAILY_OT_HOURS = 4;
const MAX_WEEKLY_OT_HOURS = 36;

export interface OTWarning { code: "DAILY_CAP" | "WEEKLY_CAP"; message: string; current: number; limit: number }

/** Check if adding OT hours would exceed daily/weekly Thai labor law limits */
export async function checkOTLimits(
  employeeId: string,
  date: Date,
  newHours: number,
): Promise<OTWarning[]> {
  const warnings: OTWarning[] = [];

  // Daily check: sum approved OT for the same date
  const dailyAgg = await prisma.overtimeRequest.aggregate({
    where: { employeeId, date, status: { in: ["PENDING", "APPROVED"] } },
    _sum: { hoursApproved: true },
  });
  const dailyTotal = Number(dailyAgg._sum.hoursApproved ?? 0) + newHours;
  if (dailyTotal > MAX_DAILY_OT_HOURS) {
    warnings.push({
      code: "DAILY_CAP",
      message: `OT วันนี้รวม ${dailyTotal} ชม. เกินกำหนด ${MAX_DAILY_OT_HOURS} ชม./วัน`,
      current: dailyTotal,
      limit: MAX_DAILY_OT_HOURS,
    });
  }

  // Weekly check: Mon-Sun of the given date
  const dayOfWeek = date.getUTCDay();
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - ((dayOfWeek + 6) % 7));
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 7);

  const weeklyAgg = await prisma.overtimeRequest.aggregate({
    where: {
      employeeId,
      date: { gte: monday, lt: sunday },
      status: { in: ["PENDING", "APPROVED"] },
    },
    _sum: { hoursApproved: true },
  });
  const weeklyTotal = Number(weeklyAgg._sum.hoursApproved ?? 0) + newHours;
  if (weeklyTotal > MAX_WEEKLY_OT_HOURS) {
    warnings.push({
      code: "WEEKLY_CAP",
      message: `OT สัปดาห์นี้รวม ${weeklyTotal} ชม. เกินกำหนด ${MAX_WEEKLY_OT_HOURS} ชม./สัปดาห์`,
      current: weeklyTotal,
      limit: MAX_WEEKLY_OT_HOURS,
    });
  }

  return warnings;
}

/** Check if a date is a public holiday or weekend */
export async function isHolidayOrWeekend(date: Date): Promise<boolean> {
  const day = date.getUTCDay();
  if (day === 0 || day === 6) return true; // weekend

  const holiday = await prisma.publicHoliday.findFirst({
    where: { date },
    select: { id: true },
  });
  return holiday !== null;
}
