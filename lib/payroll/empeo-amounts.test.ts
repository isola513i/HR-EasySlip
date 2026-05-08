import { describe, expect, test } from "bun:test";
import { Decimal } from "@prisma/client/runtime/library";
import {
  computeAbsentDeduction,
  computeCashoutAmount,
  computeLwpDeduction,
  computeOtAmount,
  dailyRate,
  hourlyRate,
} from "./empeo-amounts";

const D = (s: string | number) => new Decimal(s);

describe("dailyRate", () => {
  test("MONTHLY divides by 30", () => {
    expect(dailyRate(D(30000), "MONTHLY").toString()).toBe("1000");
  });
  test("DAILY passes through", () => {
    expect(dailyRate(D(500), "DAILY").toString()).toBe("500");
  });
  test("INTERN passes through (treated like DAILY)", () => {
    expect(dailyRate(D(350), "INTERN").toString()).toBe("350");
  });
});

describe("hourlyRate", () => {
  test("MONTHLY 30000 → 125/hr", () => {
    expect(hourlyRate(D(30000), "MONTHLY").toString()).toBe("125");
  });
  test("DAILY 800 → 100/hr", () => {
    expect(hourlyRate(D(800), "DAILY").toString()).toBe("100");
  });
});

describe("computeOtAmount", () => {
  const hourly = D(125);
  test("WEEKDAY 4hrs × 125 × 1.5 = 750.00", () => {
    expect(computeOtAmount(D(4), "WEEKDAY", hourly).toFixed(2)).toBe("750.00");
  });
  test("HOLIDAY 8hrs × 125 × 3.0 = 3000.00", () => {
    expect(computeOtAmount(D(8), "HOLIDAY", hourly).toFixed(2)).toBe("3000.00");
  });
  test("HOLIDAY_WORK 8hrs × 125 × 1.0 = 1000.00", () => {
    expect(computeOtAmount(D(8), "HOLIDAY_WORK", hourly).toFixed(2)).toBe("1000.00");
  });
  test("zero hours → 0.00", () => {
    expect(computeOtAmount(D(0), "WEEKDAY", hourly).toFixed(2)).toBe("0.00");
  });
  test("rounds half-up at 2 decimal places", () => {
    // 0.5hr × 33.333... × 1.5 = 24.99999... → 25.00
    expect(computeOtAmount(D("0.5"), "WEEKDAY", D("33.333333")).toFixed(2)).toBe("25.00");
  });
});

describe("deductions", () => {
  test("LWP 2 days × 1000 = 2000.00", () => {
    expect(computeLwpDeduction(D(2), D(1000)).toFixed(2)).toBe("2000.00");
  });
  test("Absent 1.5 days × 800 = 1200.00", () => {
    expect(computeAbsentDeduction(D("1.5"), D(800)).toFixed(2)).toBe("1200.00");
  });
  test("Cashout 6 days × 1000 = 6000.00", () => {
    expect(computeCashoutAmount(D(6), D(1000)).toFixed(2)).toBe("6000.00");
  });
});
