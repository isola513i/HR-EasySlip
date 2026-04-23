// ════════════════════════════════════════════════════════════════
// Unit Tests — computeAnnualLeaveGrant + computeResignationAnnualProrate
// Runner: Bun (`bun test`)
// Command: `bun test lib/leave/annual-quota-engine.test.ts`
// ════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'bun:test';
import { Decimal } from '@prisma/client/runtime/library';
import {
  computeAnnualLeaveGrant,
  computeResignationAnnualProrate,
  roundDownToStep,
  ANNUAL_LEAVE_FULL_YEAR_DAYS,
  ROUNDING_STEP,
  DAYS_IN_YEAR_BASIS,
  type ExistingAnnualQuota,
} from './annual-quota-engine';

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

/** Construct a UTC date at 00:00 — kills local-timezone flakiness. */
const d = (iso: string): Date => new Date(`${iso}T00:00:00.000Z`);

const expectDays = (actual: Decimal, expected: string) =>
  expect(actual.toFixed(2)).toBe(expected);

// ════════════════════════════════════════════════════════════════
// roundDownToStep
// ════════════════════════════════════════════════════════════════

describe('roundDownToStep', () => {
  it('floors to nearest 0.5', () => {
    expect(roundDownToStep(4.29, 0.5)).toBe(4.0);
    expect(roundDownToStep(4.5, 0.5)).toBe(4.5);
    expect(roundDownToStep(4.51, 0.5)).toBe(4.5);
    expect(roundDownToStep(4.99, 0.5)).toBe(4.5);
    expect(roundDownToStep(5.0, 0.5)).toBe(5.0);
    expect(roundDownToStep(0.49, 0.5)).toBe(0.0);
  });

  it('throws on non-positive step', () => {
    expect(() => roundDownToStep(1, 0)).toThrow();
    expect(() => roundDownToStep(1, -0.5)).toThrow();
  });
});

// ════════════════════════════════════════════════════════════════
// CASE A — ยังไม่ครบ 1 ปี
// ════════════════════════════════════════════════════════════════

describe('CASE A: not yet 1 year of service', () => {
  it('returns NONE on hire day (Day 1)', () => {
    const r = computeAnnualLeaveGrant(d('2025-04-15'), d('2025-04-15'), null);
    expect(r.action).toBe('NONE');
  });

  it('returns NONE 6 months in', () => {
    const r = computeAnnualLeaveGrant(d('2025-04-15'), d('2025-10-15'), null);
    expect(r.action).toBe('NONE');
  });

  it('returns NONE one day before anniversary', () => {
    const r = computeAnnualLeaveGrant(d('2025-04-15'), d('2026-04-14'), null);
    expect(r.action).toBe('NONE');
  });

  it('returns NONE even if future existingQuota somehow passed (defensive)', () => {
    const r = computeAnnualLeaveGrant(d('2025-04-15'), d('2025-06-01'), {
      quotaYear: 2025,
    });
    expect(r.action).toBe('NONE');
  });
});

// ════════════════════════════════════════════════════════════════
// CASE B — ครบ 1 ปีพอดี / anniversary อยู่ในปีนี้ (Prorate)
// ════════════════════════════════════════════════════════════════

describe('CASE B: anniversary year — prorate', () => {
  it('hire 2025-04-15 on exact anniversary 2026-04-15 → 4.00 days', () => {
    // daysRemaining = (2026-12-31 − 2026-04-15) + 1 = 261 days
    // raw = 6 × 261 / 365 = 4.2904...
    // floor step 0.5 = 4.00
    const r = computeAnnualLeaveGrant(d('2025-04-15'), d('2026-04-15'), null);
    expect(r.action).toBe('GRANT_PRORATED');
    if (r.action === 'GRANT_PRORATED') {
      expectDays(r.days, '4.00');
      expect(r.eligibleFrom.toISOString().slice(0, 10)).toBe('2026-04-15');
      expect(r.basis).toContain('daysRemaining=261');
      expect(r.basis).toContain('step=0.5');
    }
  });

  it('cron runs mid-year after anniversary, no quota yet → still prorate', () => {
    const r = computeAnnualLeaveGrant(d('2025-04-15'), d('2026-09-01'), null);
    expect(r.action).toBe('GRANT_PRORATED');
    if (r.action === 'GRANT_PRORATED') {
      expectDays(r.days, '4.00'); // same result — anniversary baseline ไม่ใช่วัน cron
    }
  });

  it('Jan 1 hire → anniversary Jan 1 next year → full 6.00 via prorate branch', () => {
    // daysRemaining = 365 (inclusive); raw = 6.0; floor 0.5 = 6.0
    const r = computeAnnualLeaveGrant(d('2025-01-01'), d('2026-01-01'), null);
    expect(r.action).toBe('GRANT_PRORATED');
    if (r.action === 'GRANT_PRORATED') {
      expectDays(r.days, '6.00');
    }
  });

  it('Dec 31 hire → anniversary Dec 31 → only 1 day remaining → 0.00', () => {
    // daysRemaining = 1; raw = 6/365 = 0.0164; floor 0.5 = 0.0
    const r = computeAnnualLeaveGrant(d('2024-12-31'), d('2025-12-31'), null);
    expect(r.action).toBe('GRANT_PRORATED');
    if (r.action === 'GRANT_PRORATED') {
      expectDays(r.days, '0.00');
    }
  });

  it('Dec 1 hire → anniversary Dec 1 → 31 days remaining → 0.50', () => {
    // daysRemaining = 31; raw = 6×31/365 = 0.5095; floor 0.5 = 0.5
    const r = computeAnnualLeaveGrant(d('2024-12-01'), d('2025-12-01'), null);
    expect(r.action).toBe('GRANT_PRORATED');
    if (r.action === 'GRANT_PRORATED') {
      expectDays(r.days, '0.50');
    }
  });

  it('rounding boundary — raw just above 4.5 → 4.50', () => {
    // hire 2025-04-02 → anniversary 2026-04-02
    // 2026-04-02 → 2026-12-31 = 273 days, +1 = 274
    // raw = 6 × 274 / 365 = 4.5041...
    // floor 0.5 = 4.5
    const r = computeAnnualLeaveGrant(d('2025-04-02'), d('2026-04-02'), null);
    expect(r.action).toBe('GRANT_PRORATED');
    if (r.action === 'GRANT_PRORATED') {
      expectDays(r.days, '4.50');
      expect(r.basis).toContain('daysRemaining=274');
    }
  });

  it('rounding boundary — raw just below 4.5 → 4.00', () => {
    // hire 2025-04-03 → anniversary 2026-04-03
    // 2026-04-03 → 2026-12-31 = 272 days, +1 = 273
    // raw = 6 × 273 / 365 = 4.4877...
    // floor 0.5 = 4.0
    const r = computeAnnualLeaveGrant(d('2025-04-03'), d('2026-04-03'), null);
    expect(r.action).toBe('GRANT_PRORATED');
    if (r.action === 'GRANT_PRORATED') {
      expectDays(r.days, '4.00');
    }
  });

  it('Feb 29 leap-year hire → date-fns clamps anniversary to Feb 28', () => {
    // hire 2024-02-29 → anniversary 2025-02-28 (not leap, clamped)
    // 2025-02-28 → 2025-12-31 = 306 days, +1 = 307
    // raw = 6 × 307 / 365 = 5.0465; floor 0.5 = 5.0
    const r = computeAnnualLeaveGrant(d('2024-02-29'), d('2025-02-28'), null);
    expect(r.action).toBe('GRANT_PRORATED');
    if (r.action === 'GRANT_PRORATED') {
      expectDays(r.days, '5.00');
      expect(r.eligibleFrom.toISOString().slice(0, 10)).toBe('2025-02-28');
    }
  });

  it('emits basis string with all diagnostic fields', () => {
    const r = computeAnnualLeaveGrant(d('2025-04-15'), d('2026-04-15'), null);
    if (r.action !== 'GRANT_PRORATED') throw new Error('unexpected');
    expect(r.basis).toMatch(/anniversary=2026-04-15/);
    expect(r.basis).toMatch(/daysRemaining=261\/365/);
    expect(r.basis).toMatch(/raw=/);
    expect(r.basis).toMatch(/step=0\.5/);
  });
});

// ════════════════════════════════════════════════════════════════
// CASE C — ปีถัดไป (anniversary < currentYear) — Full grant
// ════════════════════════════════════════════════════════════════

describe('CASE C: post-anniversary year — full grant', () => {
  it('grants full 6.00 on Jan 1 of year after anniversary', () => {
    const r = computeAnnualLeaveGrant(d('2025-04-15'), d('2027-01-01'), null);
    expect(r.action).toBe('GRANT_FULL');
    if (r.action === 'GRANT_FULL') {
      expectDays(r.days, '6.00');
      expect(r.eligibleFrom.toISOString().slice(0, 10)).toBe('2027-01-01');
    }
  });

  it('robust — grants full even if cron runs late (e.g. Jan 15)', () => {
    const r = computeAnnualLeaveGrant(d('2025-04-15'), d('2027-01-15'), null);
    expect(r.action).toBe('GRANT_FULL');
    if (r.action === 'GRANT_FULL') {
      expectDays(r.days, '6.00');
    }
  });

  it('grants full for Year 3+', () => {
    const r = computeAnnualLeaveGrant(d('2020-06-01'), d('2026-03-10'), null);
    expect(r.action).toBe('GRANT_FULL');
    if (r.action === 'GRANT_FULL') {
      expectDays(r.days, '6.00');
    }
  });
});

// ════════════════════════════════════════════════════════════════
// CASE D — Idempotency (already granted)
// ════════════════════════════════════════════════════════════════

describe('CASE D: quota already exists → idempotent NONE', () => {
  it('skips when existingQuota.quotaYear matches currentYear (prorate year)', () => {
    const existing: ExistingAnnualQuota = { quotaYear: 2026 };
    const r = computeAnnualLeaveGrant(d('2025-04-15'), d('2026-08-01'), existing);
    expect(r.action).toBe('NONE');
    if (r.action === 'NONE') {
      expect(r.reason).toContain('2026');
    }
  });

  it('skips when existingQuota.quotaYear matches currentYear (full year)', () => {
    const existing: ExistingAnnualQuota = { quotaYear: 2027 };
    const r = computeAnnualLeaveGrant(d('2025-04-15'), d('2027-06-10'), existing);
    expect(r.action).toBe('NONE');
  });

  it('does NOT skip when existingQuota is for a prior year', () => {
    // Older quota from 2026 shouldn't block 2027 grant
    const existing: ExistingAnnualQuota = { quotaYear: 2026 };
    const r = computeAnnualLeaveGrant(d('2025-04-15'), d('2027-01-02'), existing);
    expect(r.action).toBe('GRANT_FULL');
  });
});

// ════════════════════════════════════════════════════════════════
// Determinism / Constants
// ════════════════════════════════════════════════════════════════

describe('constants locked-in (guard regressions)', () => {
  it('ANNUAL_LEAVE_FULL_YEAR_DAYS = 6', () => {
    expect(ANNUAL_LEAVE_FULL_YEAR_DAYS).toBe(6);
  });
  it('ROUNDING_STEP = 0.5', () => {
    expect(ROUNDING_STEP).toBe(0.5);
  });
  it('DAYS_IN_YEAR_BASIS = 365', () => {
    expect(DAYS_IN_YEAR_BASIS).toBe(365);
  });
});

// ════════════════════════════════════════════════════════════════
// computeResignationAnnualProrate
// ════════════════════════════════════════════════════════════════

describe('computeResignationAnnualProrate', () => {
  it('returns 0 if not yet 1 year (no annual entitlement)', () => {
    const r = computeResignationAnnualProrate({
      hireDate: d('2025-04-15'),
      terminationDate: d('2026-02-01'),
      usedDays: new Decimal(0),
    });
    expect(r.toFixed(2)).toBe('0.00');
  });

  it('prorates in anniversary year — partial service', () => {
    // hire 2025-04-15, terminate 2026-10-15
    // startOfEntitlement = 2026-04-15, daysWorked = (2026-10-15 − 2026-04-15) + 1 = 184
    // raw = 6 × 184 / 365 = 3.0246; floor 0.5 = 3.0
    // usedDays = 1.0 → cashOut = 2.0
    const r = computeResignationAnnualProrate({
      hireDate: d('2025-04-15'),
      terminationDate: d('2026-10-15'),
      usedDays: new Decimal(1),
    });
    expect(r.toFixed(2)).toBe('2.00');
  });

  it('post-anniversary year, mid-year resign', () => {
    // hire 2024-01-01, terminate 2026-06-30
    // anniversary = 2025-01-01 (< yearStart 2026-01-01)
    // startOfEntitlement = 2026-01-01, daysWorked = 181
    // raw = 6 × 181 / 365 = 2.9753; floor 0.5 = 2.5
    // usedDays = 0 → cashOut = 2.5
    const r = computeResignationAnnualProrate({
      hireDate: d('2024-01-01'),
      terminationDate: d('2026-06-30'),
      usedDays: new Decimal(0),
    });
    expect(r.toFixed(2)).toBe('2.50');
  });

  it('caps entitlement at 6 days even if full year', () => {
    // hire 2020-01-01, terminate 2026-12-31 (full year worked)
    // daysWorked = 365, raw = 6.0, entitled = 6.0
    const r = computeResignationAnnualProrate({
      hireDate: d('2020-01-01'),
      terminationDate: d('2026-12-31'),
      usedDays: new Decimal(0),
    });
    expect(r.toFixed(2)).toBe('6.00');
  });

  it('never returns negative — usedDays greater than entitled clamps to 0', () => {
    const r = computeResignationAnnualProrate({
      hireDate: d('2025-04-15'),
      terminationDate: d('2026-10-15'),
      usedDays: new Decimal(5), // > entitled 3.0
    });
    expect(r.toFixed(2)).toBe('0.00');
  });

  it('resigns exactly on anniversary → entitlement = 1 day of service', () => {
    // hire 2025-04-15, terminate 2026-04-15
    // startOfEntitlement = 2026-04-15, daysWorked = 1
    // raw = 6/365 = 0.016; floor 0.5 = 0
    const r = computeResignationAnnualProrate({
      hireDate: d('2025-04-15'),
      terminationDate: d('2026-04-15'),
      usedDays: new Decimal(0),
    });
    expect(r.toFixed(2)).toBe('0.00');
  });
});
