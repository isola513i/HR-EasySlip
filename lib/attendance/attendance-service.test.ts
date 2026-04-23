import { describe, test, expect, mock, beforeEach } from "bun:test";
import type { Caller, RequestMeta } from "@/lib/api/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFindMany = mock((): Promise<any[]> => Promise.resolve([]));
const mockCount = mock((): Promise<number> => Promise.resolve(0));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCreate = mock((): Promise<any> =>
  Promise.resolve({ id: "rec-1", employeeId: "emp-1", clockType: "IN", clockedAt: new Date() }),
);

// Transaction mock: executes the callback with a tx client that shares the same mocks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTransaction = mock(async (fn: (tx: any) => Promise<any>) => {
  const txClient = {
    attendanceRecord: { findMany: mockFindMany, create: mockCreate },
  };
  return fn(txClient);
});

mock.module("@/lib/prisma", () => ({
  prisma: {
    attendanceRecord: { findMany: mockFindMany, count: mockCount, create: mockCreate },
    $transaction: mockTransaction,
  },
}));

mock.module("@/lib/audit/logger", () => ({
  writeAuditLog: mock(() => Promise.resolve()),
}));

const mockAssertCycleOpen = mock(() => Promise.resolve());
mock.module("@/lib/api/cycle-guard", () => ({
  assertCycleOpen: mockAssertCycleOpen,
}));

const { clockInOut, getMyRecords } = await import("./attendance-service");

const caller: Caller = { userId: "u-1", employeeId: "emp-1", roles: ["EMPLOYEE"] as never[] };
const meta: RequestMeta & { deviceId?: string } = { ip: "127.0.0.1", userAgent: "test" };

beforeEach(() => {
  mockFindMany.mockReset();
  mockCount.mockReset();
  mockCreate.mockReset();
  mockTransaction.mockReset();
  mockAssertCycleOpen.mockReset();

  mockFindMany.mockResolvedValue([]);
  mockCreate.mockResolvedValue({
    id: "rec-1", employeeId: "emp-1", clockType: "IN", clockedAt: new Date(),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockTransaction.mockImplementation(async (fn: (tx: any) => Promise<any>) => {
    const txClient = {
      attendanceRecord: { findMany: mockFindMany, create: mockCreate },
    };
    return fn(txClient);
  });
  mockAssertCycleOpen.mockResolvedValue(undefined);
});

describe("clockInOut", () => {
  test("clock IN success — creates record in transaction", async () => {
    const result = await clockInOut(caller, { clockType: "IN", workLocation: "OFFICE" }, meta);
    expect(result.id).toBe("rec-1");
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("clock IN duplicate — throws DUPLICATE_CLOCK", async () => {
    mockFindMany.mockResolvedValueOnce([{ clockType: "IN" }]);

    await expect(
      clockInOut(caller, { clockType: "IN", workLocation: "OFFICE" }, meta),
    ).rejects.toThrow("DUPLICATE_CLOCK");
  });

  test("clock OUT success — creates record", async () => {
    mockFindMany.mockResolvedValueOnce([{ clockType: "IN" }]);
    mockCreate.mockResolvedValueOnce({
      id: "rec-2", employeeId: "emp-1", clockType: "OUT", clockedAt: new Date(),
    });

    const result = await clockInOut(caller, { clockType: "OUT", workLocation: "OFFICE" }, meta);
    expect(result.id).toBe("rec-2");
  });

  test("clock OUT with no prior clock IN — throws DUPLICATE_CLOCK", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    await expect(
      clockInOut(caller, { clockType: "OUT", workLocation: "OFFICE" }, meta),
    ).rejects.toThrow("DUPLICATE_CLOCK");
  });

  test("clock OUT on different day from clock IN — success (overnight shift)", async () => {
    mockFindMany.mockResolvedValueOnce([{ clockType: "IN" }]);
    mockCreate.mockResolvedValueOnce({
      id: "rec-3", employeeId: "emp-1", clockType: "OUT", clockedAt: new Date(),
    });

    const result = await clockInOut(caller, { clockType: "OUT", workLocation: "OFFICE" }, meta);
    expect(result.id).toBe("rec-3");
  });

  test("frozen payroll cycle — throws CYCLE_LOCKED", async () => {
    mockAssertCycleOpen.mockRejectedValueOnce(
      Object.assign(new Error("CYCLE_LOCKED"), { code: "CYCLE_LOCKED" }),
    );

    await expect(
      clockInOut(caller, { clockType: "IN", workLocation: "OFFICE" }, meta),
    ).rejects.toThrow("CYCLE_LOCKED");
  });
});

describe("getMyRecords", () => {
  test("returns only own records within date range", async () => {
    const records = [
      { id: "r1", employeeId: "emp-1", clockType: "IN", clockedAt: new Date() },
    ];
    mockFindMany.mockResolvedValueOnce(records);
    mockCount.mockResolvedValueOnce(1);

    const result = await getMyRecords("emp-1", {
      from: "2026-04-01",
      to: "2026-04-30",
      page: 1,
      perPage: 20,
    });

    expect(result.records).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});
