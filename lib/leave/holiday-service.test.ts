import { describe, test, expect, mock, beforeEach } from "bun:test";

// ── Mock Prisma ──────────────────────────────────────────────
const mockFindMany = mock((): Promise<unknown[]> => Promise.resolve([]));
const mockFindUnique = mock((): Promise<unknown> => Promise.resolve(null));
const mockCreate = mock((): Promise<unknown> =>
  Promise.resolve({ id: "h-1", date: new Date("2026-01-01"), year: 2026, name: "วันขึ้นปีใหม่" }),
);
const mockUpdate = mock((): Promise<unknown> =>
  Promise.resolve({ id: "h-1", name: "Updated" }),
);
const mockDelete = mock((): Promise<unknown> => Promise.resolve({ id: "h-1" }));

mock.module("@/lib/prisma", () => ({
  prisma: {
    publicHoliday: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

// ── Mock Audit Logger ────────────────────────────────────────
const mockWriteAuditLog = mock(() => Promise.resolve());
mock.module("@/lib/audit/logger", () => ({
  writeAuditLog: mockWriteAuditLog,
}));

// ── Import after mocks ──────────────────────────────────────
const { listHolidays, createHoliday, updateHoliday, deleteHoliday } =
  await import("./holiday-service");

beforeEach(() => {
  mockFindMany.mockReset().mockResolvedValue([]);
  mockFindUnique.mockReset().mockResolvedValue(null);
  mockCreate.mockReset().mockResolvedValue({ id: "h-1", date: new Date("2026-01-01"), year: 2026, name: "วันขึ้นปีใหม่" });
  mockUpdate.mockReset().mockResolvedValue({ id: "h-1", name: "Updated" });
  mockDelete.mockReset().mockResolvedValue({ id: "h-1" });
  mockWriteAuditLog.mockReset().mockResolvedValue(undefined);
});

describe("listHolidays", () => {
  test("returns holidays ordered by date", async () => {
    const holidays = [{ id: "h-1" }, { id: "h-2" }];
    mockFindMany.mockResolvedValueOnce(holidays);
    const result = await listHolidays(2026);
    expect(result).toHaveLength(2);
  });
});

describe("createHoliday", () => {
  test("creates record + writes audit log", async () => {
    const result = await createHoliday(
      { date: "2026-01-01", name: "วันขึ้นปีใหม่", isSubstituted: false },
      "user-1",
    );
    expect(result.id).toBe("h-1");
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockWriteAuditLog).toHaveBeenCalledTimes(1);
  });
});

describe("updateHoliday", () => {
  test("updates record + writes audit log", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "h-1", name: "Old" });
    const result = await updateHoliday("h-1", { name: "Updated" }, "user-1");
    expect(result.name).toBe("Updated");
    expect(mockWriteAuditLog).toHaveBeenCalledTimes(1);
  });

  test("not found → throws RECORD_NOT_FOUND", async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    await expect(updateHoliday("h-999", { name: "X" }, "user-1")).rejects.toThrow(
      "RECORD_NOT_FOUND",
    );
  });
});

describe("deleteHoliday", () => {
  test("deletes record + writes audit log", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "h-1" });
    await deleteHoliday("h-1", "user-1");
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockWriteAuditLog).toHaveBeenCalledTimes(1);
  });
});
