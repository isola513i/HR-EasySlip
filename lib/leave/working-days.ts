// ════════════════════════════════════════════════════════════════
// Working Days Calculator — skip weekends + public holidays
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import {
  addDays,
  isWeekend,
  differenceInCalendarDays,
  startOfDay,
} from "date-fns";

/**
 * Calculate number of working days between start and end (inclusive).
 * Skips weekends (Sat/Sun) and public holidays from the database.
 */
export async function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  halfDay: "FULL" | "MORNING" | "AFTERNOON" = "FULL",
): Promise<number> {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  const totalCalendarDays = differenceInCalendarDays(end, start) + 1;

  // Fetch public holidays in range
  const holidays = await prisma.publicHoliday.findMany({
    where: { date: { gte: start, lte: end } },
    select: { date: true },
  });

  const holidaySet = new Set(
    holidays.map((h) => startOfDay(h.date).toISOString()),
  );

  let workingDays = 0;
  for (let i = 0; i < totalCalendarDays; i++) {
    const day = addDays(start, i);
    if (isWeekend(day)) continue;
    if (holidaySet.has(startOfDay(day).toISOString())) continue;
    workingDays++;
  }

  // Half-day only applies to single-day leave
  if (halfDay !== "FULL" && workingDays === 1) {
    return 0.5;
  }

  return workingDays;
}
