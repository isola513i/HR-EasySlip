import { prisma } from "@/lib/prisma";
import { DomainError, ErrorCodes } from "@/lib/api/errors";

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7

/**
 * Get the start and end of "today" in Asia/Bangkok timezone.
 * Returns UTC Date objects representing 00:00 and 23:59:59.999 Bangkok time.
 */
export function getBangkokDayBounds(now: Date): { todayStart: Date; todayEnd: Date } {
  const bangkokMs = now.getTime() + BANGKOK_OFFSET_MS;
  const bangkokDay = new Date(bangkokMs);
  // Zero out time in Bangkok-local perspective, then convert back to UTC
  const startOfDayBangkok = new Date(
    Date.UTC(bangkokDay.getUTCFullYear(), bangkokDay.getUTCMonth(), bangkokDay.getUTCDate()),
  );
  const todayStart = new Date(startOfDayBangkok.getTime() - BANGKOK_OFFSET_MS);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { todayStart, todayEnd };
}

/**
 * Validate clock action:
 * - IN: no open IN exists today (i.e. no IN without subsequent OUT)
 * - OUT: there IS an open IN today (i.e. an IN without subsequent OUT)
 */
export async function validateClockAction(
  employeeId: string,
  clockType: "IN" | "OUT",
  todayStart: Date,
  todayEnd: Date,
): Promise<void> {
  const todayRecords = await prisma.attendanceRecord.findMany({
    where: {
      employeeId,
      clockedAt: { gte: todayStart, lte: todayEnd },
    },
    orderBy: { clockedAt: "asc" },
    select: { clockType: true },
  });

  const lastRecord = todayRecords.at(-1);

  if (clockType === "IN") {
    // If last record today is IN (no subsequent OUT), it's a duplicate
    if (lastRecord?.clockType === "IN") {
      throw new DomainError(ErrorCodes.DUPLICATE_CLOCK, {
        message: "Already clocked in — clock out first",
      }, 409);
    }
  } else {
    // OUT requires an open IN today
    if (!lastRecord || lastRecord.clockType === "OUT") {
      throw new DomainError(ErrorCodes.DUPLICATE_CLOCK, {
        message: "No open clock-in found — clock in first",
      }, 409);
    }
  }
}
