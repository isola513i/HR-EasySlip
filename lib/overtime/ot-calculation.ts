import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";

export const WORK_END_HOUR = 18; // 18:00 end of normal day
const MIN_OT_MINUTES = 30;
const ROUND_STEP_MINUTES = 30;

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
  const otMinutes = (clockOut.getUTCHours() * 60 + clockOut.getUTCMinutes()) - (WORK_END_HOUR * 60);
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
