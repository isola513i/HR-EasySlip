import { describe, test, expect } from "bun:test";
import { computeStatus } from "./attendance-dashboard-service";

// Helper: Bangkok-time hour:minute → UTC Date for clockedAt
function bkk(hour: number, minute: number): Date {
  const utc = new Date(Date.UTC(2026, 3, 29, hour - 7, minute, 0));
  return utc;
}

const lateAfter = { h: 9, m: 15 };

describe("computeStatus", () => {
  test("HOLIDAY beats everything", () => {
    expect(
      computeStatus({ firstClockInAt: bkk(9, 0), isOnLeave: true, isHoliday: true, lateAfter }),
    ).toBe("HOLIDAY");
  });

  test("ON_LEAVE when no holiday and active leave", () => {
    expect(
      computeStatus({ firstClockInAt: null, isOnLeave: true, isHoliday: false, lateAfter }),
    ).toBe("ON_LEAVE");
  });

  test("ABSENT when no clock-in, no leave, no holiday", () => {
    expect(
      computeStatus({ firstClockInAt: null, isOnLeave: false, isHoliday: false, lateAfter }),
    ).toBe("ABSENT");
  });

  test("ON_TIME at 09:00 Bangkok", () => {
    expect(
      computeStatus({ firstClockInAt: bkk(9, 0), isOnLeave: false, isHoliday: false, lateAfter }),
    ).toBe("ON_TIME");
  });

  test("ON_TIME at 09:15 Bangkok (boundary, inclusive)", () => {
    expect(
      computeStatus({ firstClockInAt: bkk(9, 15), isOnLeave: false, isHoliday: false, lateAfter }),
    ).toBe("ON_TIME");
  });

  test("LATE at 09:16 Bangkok", () => {
    expect(
      computeStatus({ firstClockInAt: bkk(9, 16), isOnLeave: false, isHoliday: false, lateAfter }),
    ).toBe("LATE");
  });

  test("LATE at 10:00 Bangkok", () => {
    expect(
      computeStatus({ firstClockInAt: bkk(10, 0), isOnLeave: false, isHoliday: false, lateAfter }),
    ).toBe("LATE");
  });

  test("ON_TIME at 08:30 (early arrival)", () => {
    expect(
      computeStatus({ firstClockInAt: bkk(8, 30), isOnLeave: false, isHoliday: false, lateAfter }),
    ).toBe("ON_TIME");
  });

  test("threshold respects custom config (late after 08:30)", () => {
    expect(
      computeStatus({
        firstClockInAt: bkk(8, 31),
        isOnLeave: false,
        isHoliday: false,
        lateAfter: { h: 8, m: 30 },
      }),
    ).toBe("LATE");
  });
});
