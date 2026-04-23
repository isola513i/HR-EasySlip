import { describe, test, expect, mock, beforeEach } from "bun:test";
import { Decimal } from "@prisma/client/runtime/library";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFindMany = mock((): Promise<any[]> => Promise.resolve([]));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFindFirst = mock((): Promise<any> => Promise.resolve(null));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFindUnique = mock((): Promise<any> => Promise.resolve({ managerId: "mgr-1" }));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCreate = mock((): Promise<any> => Promise.resolve({ id: "lr-1" }));
const mockUpdate = mock(() => Promise.resolve({}));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTransaction = mock(async (fn: (tx: any) => Promise<any>) => {
  const tx = {
    leaveQuota: { findFirst: mockFindFirst, update: mockUpdate },
    leaveRequest: { create: mockCreate, findMany: mockFindMany },
    employee: { findUnique: mockFindUnique },
    auditLog: { create: mock(() => Promise.resolve({})) },
  };
  return fn(tx);
});

mock.module("@/lib/prisma", () => ({
  prisma: { $transaction: mockTransaction },
}));

mock.module("@/lib/audit/logger", () => ({
  writeAuditLog: mock(() => Promise.resolve()),
}));

mock.module("@/lib/api/cycle-guard", () => ({
  assertCycleOpen: mock(() => Promise.resolve()),
}));

mock.module("./working-days", () => ({
  calculateWorkingDays: mock((_s: Date, _e: Date, _h: string) => Promise.resolve(5)),
}));

const { submitLeaveRequest } = await import("./leave-service");

const caller = { userId: "u-1", employeeId: "emp-1", roles: ["EMPLOYEE"] as never[] };
const meta = { ip: "127.0.0.1", userAgent: "test" };

let createCallCount = 0;
beforeEach(() => {
  mockFindFirst.mockReset();
  mockCreate.mockReset();
  mockUpdate.mockReset();
  mockFindUnique.mockReset().mockResolvedValue({ managerId: "mgr-1" });
  createCallCount = 0;
  mockCreate.mockImplementation(() => {
    createCallCount++;
    return Promise.resolve({ id: `lr-${createCallCount}`, leaveType: "SICK", daysRequested: new Decimal(5) });
  });
});

describe("SICK → LWP overflow", () => {
  test("SICK quota sufficient → single SICK request, no overflow", async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: "q-1", allocatedDays: new Decimal(30), usedDays: new Decimal(0), pendingDays: new Decimal(0),
    });

    const result = await submitLeaveRequest(caller, {
      leaveType: "SICK", startDate: "2026-04-28", endDate: "2026-05-02", halfDay: "FULL", reason: "Sick",
    }, meta);

    expect(result.overflow).toBeNull();
    expect(result.request.id).toBe("lr-1");
  });

  test("SICK 3 remaining, request 5 → parent SICK 3 + child LWP 2", async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: "q-1", allocatedDays: new Decimal(30), usedDays: new Decimal(27), pendingDays: new Decimal(0),
    });

    const result = await submitLeaveRequest(caller, {
      leaveType: "SICK", startDate: "2026-04-28", endDate: "2026-05-02", halfDay: "FULL", reason: "Sick",
    }, meta);

    // 2 creates: parent SICK + child LWP
    expect(createCallCount).toBe(2);
    expect(result.request.id).toBe("lr-1");
    expect(result.overflow).not.toBeNull();
    expect(result.overflow!.id).toBe("lr-2");
  });

  test("SICK 0 remaining → plain LWP (not auto-generated)", async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: "q-1", allocatedDays: new Decimal(30), usedDays: new Decimal(30), pendingDays: new Decimal(0),
    });

    const result = await submitLeaveRequest(caller, {
      leaveType: "SICK", startDate: "2026-04-28", endDate: "2026-05-02", halfDay: "FULL", reason: "Sick",
    }, meta);

    // Only 1 create: plain LWP
    expect(createCallCount).toBe(1);
    expect(result.overflow).toBeNull();
  });

  test("ANNUAL exceeds quota → throws INSUFFICIENT_QUOTA (no split)", async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: "q-2", allocatedDays: new Decimal(6), usedDays: new Decimal(4), pendingDays: new Decimal(0),
    });

    await expect(
      submitLeaveRequest(caller, {
        leaveType: "ANNUAL", startDate: "2026-04-28", endDate: "2026-05-02", halfDay: "FULL", reason: "Trip",
      }, meta),
    ).rejects.toThrow("INSUFFICIENT_QUOTA");
  });
});
