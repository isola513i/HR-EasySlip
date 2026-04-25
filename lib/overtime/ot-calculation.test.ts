import { describe, test, expect } from "bun:test";
import { Decimal } from "@prisma/client/runtime/library";
import { calculateWeekdayOT, calculateHolidayOT, getOTRate, roundDown30 } from "./ot-calculation";

describe("roundDown30", () => {
  test("40 min → 30", () => expect(roundDown30(40)).toBe(30));
  test("75 min → 60", () => expect(roundDown30(75)).toBe(60));
  test("90 min → 90", () => expect(roundDown30(90)).toBe(90));
  test("29 min → 0", () => expect(roundDown30(29)).toBe(0));
  test("120 min → 120", () => expect(roundDown30(120)).toBe(120));
});

describe("calculateWeekdayOT", () => {
  // Times are in UTC — Bangkok = UTC+7
  // 18:40 BKK = 11:40 UTC, 19:15 BKK = 12:15 UTC, etc.

  test("clock out 18:40 BKK → 0.5h", () => {
    const result = calculateWeekdayOT(new Date("2026-04-24T11:40:00Z"));
    expect(result?.toString()).toBe("0.5");
  });

  test("clock out 19:15 BKK → 1.0h", () => {
    const result = calculateWeekdayOT(new Date("2026-04-24T12:15:00Z"));
    expect(result?.toString()).toBe("1");
  });

  test("clock out 20:05 BKK → 2.0h", () => {
    const result = calculateWeekdayOT(new Date("2026-04-24T13:05:00Z"));
    expect(result?.toString()).toBe("2");
  });

  test("clock out 18:20 BKK → null (too short)", () => {
    const result = calculateWeekdayOT(new Date("2026-04-24T11:20:00Z"));
    expect(result).toBeNull();
  });

  test("clock out 18:00 BKK → null (no OT)", () => {
    const result = calculateWeekdayOT(new Date("2026-04-24T11:00:00Z"));
    expect(result).toBeNull();
  });
});

describe("calculateHolidayOT", () => {
  test("assigned 11:00-14:00, scan 10:32-14:11 → 3.0h (capped by assigned)", () => {
    const result = calculateHolidayOT(
      new Date("2026-04-26T11:00:00Z"), new Date("2026-04-26T14:00:00Z"),
      new Date("2026-04-26T10:32:00Z"), new Date("2026-04-26T14:11:00Z"),
    );
    expect(result?.toString()).toBe("3");
  });

  test("assigned 11:00-14:00, scan 11:05-14:11 → 2.5h (late start, round down)", () => {
    const result = calculateHolidayOT(
      new Date("2026-04-26T11:00:00Z"), new Date("2026-04-26T14:00:00Z"),
      new Date("2026-04-26T11:05:00Z"), new Date("2026-04-26T14:11:00Z"),
    );
    // effective: 11:05-14:00 = 175 min → round down 30 = 150 min = 2.5h
    expect(result?.toString()).toBe("2.5");
  });

  test("assigned 09:00-12:00, scan 09:00-12:00 → 3.0h (exact match)", () => {
    const result = calculateHolidayOT(
      new Date("2026-04-26T09:00:00Z"), new Date("2026-04-26T12:00:00Z"),
      new Date("2026-04-26T09:00:00Z"), new Date("2026-04-26T12:00:00Z"),
    );
    expect(result?.toString()).toBe("3");
  });

  test("scan inside is <30 min → null", () => {
    const result = calculateHolidayOT(
      new Date("2026-04-26T11:00:00Z"), new Date("2026-04-26T14:00:00Z"),
      new Date("2026-04-26T13:40:00Z"), new Date("2026-04-26T14:05:00Z"),
    );
    // effective: 13:40-14:00 = 20 min → null
    expect(result).toBeNull();
  });
});

describe("getOTRate", () => {
  test("WEEKDAY → 1.5", () => expect(getOTRate("WEEKDAY").toString()).toBe("1.5"));
  test("HOLIDAY → 3.0", () => expect(getOTRate("HOLIDAY").toString()).toBe("3"));
  test("HOLIDAY_WORK → 1.0", () => expect(getOTRate("HOLIDAY_WORK").toString()).toBe("1"));
});
