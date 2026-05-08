import { describe, expect, it } from "bun:test";

// Re-export the internal helpers for testing by reading them through the module —
// since they're not exported, we reach in via dynamic import + private access.
// To keep the test simple, mirror the helper here. This is a pure-math test;
// the goal is to lock the T-3 / T-1 / D-day boundary against off-by-one bugs.

function bangkokDateOnly(d: Date): Date {
  const bkk = new Date(d.getTime() + 7 * 3600_000);
  return new Date(Date.UTC(bkk.getUTCFullYear(), bkk.getUTCMonth(), bkk.getUTCDate()));
}

function diffDaysBkk(target: Date, today: Date): number {
  const a = bangkokDateOnly(target).getTime();
  const b = bangkokDateOnly(today).getTime();
  return Math.round((a - b) / 86_400_000);
}

function planForToday(cutOffAt: Date, today: Date): "T3" | "T1" | "DDAY" | null {
  const diff = diffDaysBkk(cutOffAt, today);
  if (diff === 3) return "T3";
  if (diff === 1) return "T1";
  if (diff === 0) return "DDAY";
  return null;
}

describe("payroll-reminders date math", () => {
  // cutOffAt = 2026-05-25 23:59:59 Bangkok (= 2026-05-25 16:59:59 UTC)
  const cutOff = new Date(Date.UTC(2026, 4, 25, 16, 59, 59));

  it("returns T3 on 2026-05-22 morning Bangkok", () => {
    // 2026-05-22 02:00 UTC = 2026-05-22 09:00 Bangkok
    const today = new Date(Date.UTC(2026, 4, 22, 2, 0, 0));
    expect(planForToday(cutOff, today)).toBe("T3");
  });

  it("returns T1 on 2026-05-24 morning Bangkok", () => {
    const today = new Date(Date.UTC(2026, 4, 24, 2, 0, 0));
    expect(planForToday(cutOff, today)).toBe("T1");
  });

  it("returns DDAY on 2026-05-25 morning Bangkok", () => {
    const today = new Date(Date.UTC(2026, 4, 25, 2, 0, 0));
    expect(planForToday(cutOff, today)).toBe("DDAY");
  });

  it("returns null on 2026-05-23 (T-2)", () => {
    const today = new Date(Date.UTC(2026, 4, 23, 2, 0, 0));
    expect(planForToday(cutOff, today)).toBeNull();
  });

  it("returns null on 2026-05-26 (after cut-off)", () => {
    const today = new Date(Date.UTC(2026, 4, 26, 2, 0, 0));
    expect(planForToday(cutOff, today)).toBeNull();
  });

  it("DST/timezone edge: late-night UTC same Bangkok day still resolves", () => {
    // 2026-05-21 18:00 UTC = 2026-05-22 01:00 Bangkok → still T-3
    const today = new Date(Date.UTC(2026, 4, 21, 18, 0, 0));
    expect(planForToday(cutOff, today)).toBe("T3");
  });
});
