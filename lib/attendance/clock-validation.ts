import type { PrismaClient } from "@prisma/client";
import { DomainError, ErrorCodes } from "@/lib/api/errors";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7

/**
 * Get the start and end of "today" in Asia/Bangkok timezone.
 * Returns UTC Date objects representing 00:00 and 23:59:59.999 Bangkok time.
 */
export function getBangkokDayBounds(now: Date): { todayStart: Date; todayEnd: Date } {
  const bangkokMs = now.getTime() + BANGKOK_OFFSET_MS;
  const bangkokDay = new Date(bangkokMs);
  const startOfDayBangkok = new Date(
    Date.UTC(bangkokDay.getUTCFullYear(), bangkokDay.getUTCMonth(), bangkokDay.getUTCDate()),
  );
  const todayStart = new Date(startOfDayBangkok.getTime() - BANGKOK_OFFSET_MS);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { todayStart, todayEnd };
}

/**
 * Validate clock action within a transaction to prevent race conditions.
 * Must be called inside prisma.$transaction with Serializable isolation.
 */
export async function validateClockAction(
  tx: TxClient,
  employeeId: string,
  clockType: "IN" | "OUT",
  todayStart: Date,
  todayEnd: Date,
): Promise<void> {
  const todayRecords = await tx.attendanceRecord.findMany({
    where: {
      employeeId,
      clockedAt: { gte: todayStart, lte: todayEnd },
    },
    orderBy: { clockedAt: "asc" },
    select: { clockType: true },
  });

  const lastRecord = todayRecords.at(-1);

  if (clockType === "IN") {
    if (lastRecord?.clockType === "IN") {
      throw new DomainError(ErrorCodes.DUPLICATE_CLOCK, {
        message: "Already clocked in — clock out first",
      }, 409);
    }
  } else {
    if (!lastRecord || lastRecord.clockType === "OUT") {
      throw new DomainError(ErrorCodes.DUPLICATE_CLOCK, {
        message: "No open clock-in found — clock in first",
      }, 409);
    }
  }
}
