import { describe, test, expect, mock, beforeEach } from "bun:test";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUpsert = mock((): Promise<any> => Promise.resolve({ id: "q-1" }));

mock.module("@/lib/prisma", () => ({
  prisma: {
    leaveQuota: { upsert: mockUpsert },
    systemConfig: { findMany: mock(() => Promise.resolve([])) },
  },
}));

mock.module("@/lib/audit/logger", () => ({
  writeAuditLog: mock(() => Promise.resolve()),
}));


const { grantInitialLeaveQuota } = await import("./leave-quota-grant-service");

beforeEach(() => {
  mockUpsert.mockReset().mockResolvedValue({ id: "q-1" });
});

describe("grantInitialLeaveQuota", () => {
  test("hire date 2026-01-15 → creates SICK 30d + PERSONAL 3d for year 2026", async () => {
    await grantInitialLeaveQuota("emp-1", new Date("2026-01-15"));

    expect(mockUpsert).toHaveBeenCalledTimes(2);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calls = mockUpsert.mock.calls as any[];
    const sickCall = calls[0][0];
    expect(sickCall.where.employeeId_leaveType_quotaYear.leaveType).toBe("SICK");
    expect(sickCall.create.allocatedDays).toBe(30);
    expect(sickCall.create.quotaYear).toBe(2026);

    const personalCall = calls[1][0];
    expect(personalCall.where.employeeId_leaveType_quotaYear.leaveType).toBe("PERSONAL");
    expect(personalCall.create.allocatedDays).toBe(3);
  });

  test("idempotent: call twice → no error, upsert handles it", async () => {
    await grantInitialLeaveQuota("emp-1", new Date("2026-01-15"));
    await grantInitialLeaveQuota("emp-1", new Date("2026-01-15"));

    // 4 upserts total (2 per call), all succeed
    expect(mockUpsert).toHaveBeenCalledTimes(4);
  });

  test("hire date 2025-11-01 → quota year = 2025", async () => {
    await grantInitialLeaveQuota("emp-2", new Date("2025-11-01"));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calls = mockUpsert.mock.calls as any[];
    expect(calls[0][0].create.quotaYear).toBe(2025);
  });
});
