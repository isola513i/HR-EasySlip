// ════════════════════════════════════════════════════════════════
// Annual Leave Quota Engine
// ----------------------------------------------------------------
// Rules (locked-in):
//   • Probation Day 1 → ANNUAL quota = 0
//   • สิทธิ์ 6 วัน activate ที่ hireDate + 1 year (anniversary)
//   • ปีที่ครบ 1 ปี → prorate: 6 × (daysRemaining / 365), round DOWN step 0.5
//   • ปีถัดไป (anniversary year ผ่านไปแล้ว) + ยังไม่มี quota → grant เต็ม 6 วัน
//   • NO carry-over: ปลายปี unused → AnnualLeaveCashOut
//   • Resigned mid-year → prorate ถึง terminationDate (handled by separate fn)
// ════════════════════════════════════════════════════════════════

import {
  addYears,
  differenceInCalendarDays,
  endOfYear,
  isAfter,
  startOfDay,
} from 'date-fns';
import { Prisma } from '@prisma/client';

export const ANNUAL_LEAVE_FULL_YEAR_DAYS = 6;
export const ROUNDING_STEP = 0.5;
export const DAYS_IN_YEAR_BASIS = 365;

export type ExistingAnnualQuota = {
  quotaYear: number;
} | null;

export type GrantResult =
  | { action: 'NONE'; reason: string }
  | {
      action: 'GRANT_PRORATED';
      days: Prisma.Decimal;
      eligibleFrom: Date;
      basis: string;
    }
  | {
      action: 'GRANT_FULL';
      days: Prisma.Decimal;
      eligibleFrom: Date;
    };

/**
 * Compute annual leave quota grant for an employee at a given date.
 *
 * @param hireDate       พนักงานเริ่มงาน
 * @param today          วันที่ประเมิน (โดยปกติ = วันที่ cron รัน)
 * @param existingQuota  quota record สำหรับ ANNUAL + today.year; null ถ้ายังไม่เคย grant
 */
export function computeAnnualLeaveGrant(
  hireDate: Date,
  today: Date,
  existingQuota: ExistingAnnualQuota,
): GrantResult {
  const evaluatedDate = startOfDay(today);
  const anniversary = startOfDay(addYears(hireDate, 1));
  const currentYear = evaluatedDate.getFullYear();

  // CASE A: ยังไม่ครบ 1 ปี → ไม่มีสิทธิ์
  if (isAfter(anniversary, evaluatedDate)) {
    return {
      action: 'NONE',
      reason: `Not yet 1 year of service (anniversary=${toIsoDate(anniversary)})`,
    };
  }

  // CASE D: มี quota ปีนี้แล้ว → skip (idempotent for daily cron)
  if (existingQuota && existingQuota.quotaYear === currentYear) {
    return {
      action: 'NONE',
      reason: `Quota already granted for year ${currentYear}`,
    };
  }

  // anniversary.year === currentYear → CASE B prorate
  if (anniversary.getFullYear() === currentYear) {
    const yearEnd = endOfYear(evaluatedDate);
    // inclusive count: anniversary date itself counts as day 1 of eligibility
    const daysRemaining =
      differenceInCalendarDays(yearEnd, anniversary) + 1;

    const rawDays =
      (ANNUAL_LEAVE_FULL_YEAR_DAYS * daysRemaining) / DAYS_IN_YEAR_BASIS;
    const proratedDays = roundDownToStep(rawDays, ROUNDING_STEP);

    return {
      action: 'GRANT_PRORATED',
      days: new Prisma.Decimal(proratedDays.toFixed(2)),
      eligibleFrom: anniversary,
      basis:
        `anniversary=${toIsoDate(anniversary)}; ` +
        `daysRemaining=${daysRemaining}/${DAYS_IN_YEAR_BASIS}; ` +
        `raw=${rawDays.toFixed(4)}; step=${ROUNDING_STEP}`,
    };
  }

  // CASE C: anniversary ผ่านไปในปีก่อนแล้ว + ยังไม่มี quota ปีนี้ → full grant
  // robust: ไม่ require isSameDay Jan 1; cron ยัง grant ได้แม้เริ่มทำงานกลางปี
  if (anniversary.getFullYear() < currentYear) {
    return {
      action: 'GRANT_FULL',
      days: new Prisma.Decimal(ANNUAL_LEAVE_FULL_YEAR_DAYS.toFixed(2)),
      eligibleFrom: new Date(Date.UTC(currentYear, 0, 1)),
    };
  }

  // Defensive fallback (should be unreachable)
  return { action: 'NONE', reason: 'unreachable state' };
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

export function roundDownToStep(value: number, step: number): number {
  if (step <= 0) throw new Error('step must be positive');
  return Math.floor(value / step) * step;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ────────────────────────────────────────────────────────────────
// Resignation prorate (MVP helper — called on terminationDate)
// ────────────────────────────────────────────────────────────────
//
// Rule (clarified): prorate ตามจำนวนวันที่ทำงานจริงในปีนั้น จนถึง terminationDate
// สูตร: entitled = 6 × (daysWorkedInYear / 365)  [clamp 0..6]
// cashOutDays = entitled − usedDays (ไม่รวม pendingDays เพราะต้อง settle pending ก่อน)
// ผลลัพธ์ใช้สร้าง AnnualLeaveCashOut(trigger = RESIGNATION/TERMINATION)

export function computeResignationAnnualProrate(args: {
  hireDate: Date;
  terminationDate: Date;
  usedDays: Prisma.Decimal;
}): Prisma.Decimal {
  const { hireDate, terminationDate, usedDays } = args;

  const year = terminationDate.getFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const anniversary = addYears(hireDate, 1);

  // กรณียังไม่ครบ 1 ปี → ไม่มีสิทธิ์ annual เลย
  if (isAfter(anniversary, terminationDate)) {
    return new Prisma.Decimal(0);
  }

  // วันเริ่มนับของปี = max(yearStart, anniversary)
  const startOfEntitlement = isAfter(anniversary, yearStart)
    ? anniversary
    : yearStart;

  const daysWorkedInYear =
    differenceInCalendarDays(terminationDate, startOfEntitlement) + 1;

  const rawEntitled =
    (ANNUAL_LEAVE_FULL_YEAR_DAYS * daysWorkedInYear) / DAYS_IN_YEAR_BASIS;
  const entitled = roundDownToStep(
    Math.max(0, Math.min(ANNUAL_LEAVE_FULL_YEAR_DAYS, rawEntitled)),
    ROUNDING_STEP,
  );

  const cashOut = new Prisma.Decimal(entitled.toFixed(2)).minus(usedDays);
  return cashOut.lt(0) ? new Prisma.Decimal(0) : cashOut;
}
