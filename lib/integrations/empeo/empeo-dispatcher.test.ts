import { describe, test, expect, mock, beforeEach } from "bun:test";

// ── Mock Prisma ──────────────────────────────────────────────
const mockFindMany = mock(() => Promise.resolve([]));
mock.module("@/lib/prisma", () => ({
  prisma: {
    payrollOutboxEvent: { findMany: mockFindMany },
  },
}));

// ── Mock outbox helpers ──────────────────────────────────────
const mockMarkConsumed = mock(() => Promise.resolve());
const mockMarkFailed = mock(() => Promise.resolve());
mock.module("@/lib/payroll/outbox-processor", () => ({
  markOutboxConsumed: mockMarkConsumed,
  markOutboxFailed: mockMarkFailed,
}));

// ── Mock Empeo client ────────────────────────────────────────
const mockIsEnabled = mock(() => true);
const mockSendEnvelope = mock(() => Promise.resolve({ ok: true, status: 200, body: "ok" }));
mock.module("./empeo-client", () => ({
  isEmpeoEnabled: mockIsEnabled,
  sendEnvelope: mockSendEnvelope,
}));

// ── Mock audit logger ────────────────────────────────────────
const mockWriteAuditLog = mock(() => Promise.resolve());
mock.module("@/lib/audit/logger", () => ({
  writeAuditLog: mockWriteAuditLog,
}));

// ── Mock observability logger ────────────────────────────────
mock.module("@/lib/observability/logger", () => ({
  logger: { error: mock(() => {}), info: mock(() => {}) },
}));

// ── Import after mocks ───────────────────────────────────────
const { dispatchToEmpeo } = await import("./empeo-dispatcher");

const makeEvent = (overrides: object = {}) => ({
  id: "evt-1",
  eventType: "PAYROLL_EXPORT",
  aggregateId: "cycle-1",
  idempotencyKey: "idem-1",
  payload: { foo: "bar" },
  createdAt: new Date("2026-01-01T00:00:00Z"),
  status: "PENDING",
  attempts: 0,
  ...overrides,
});

beforeEach(() => {
  mockFindMany.mockReset().mockResolvedValue([]);
  mockMarkConsumed.mockReset().mockResolvedValue(undefined);
  mockMarkFailed.mockReset().mockResolvedValue(undefined);
  mockIsEnabled.mockReset().mockReturnValue(true);
  mockSendEnvelope.mockReset().mockResolvedValue({ ok: true, status: 200, body: "ok" });
  mockWriteAuditLog.mockReset().mockResolvedValue(undefined);
});

describe("dispatchToEmpeo — disabled", () => {
  test("returns enabled:false and skips DB when not configured", async () => {
    mockIsEnabled.mockReturnValue(false);
    const result = await dispatchToEmpeo();
    expect(result).toEqual({ enabled: false, processed: 0, consumed: 0, failed: 0, skipped: 0 });
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});

describe("dispatchToEmpeo — empty queue", () => {
  test("returns zero counts when no pending events", async () => {
    mockFindMany.mockResolvedValue([]);
    const result = await dispatchToEmpeo();
    expect(result).toMatchObject({ enabled: true, processed: 0, consumed: 0, failed: 0 });
    expect(mockWriteAuditLog).not.toHaveBeenCalled();
  });
});

describe("dispatchToEmpeo — success path", () => {
  test("marks event consumed and increments counter on 200 response", async () => {
    mockFindMany.mockResolvedValue([makeEvent()]);
    mockSendEnvelope.mockResolvedValue({ ok: true, status: 200, body: "ok" });

    const result = await dispatchToEmpeo();

    expect(result).toMatchObject({ consumed: 1, failed: 0, skipped: 0 });
    expect(mockMarkConsumed).toHaveBeenCalledWith("evt-1");
    expect(mockMarkFailed).not.toHaveBeenCalled();
    expect(mockWriteAuditLog).toHaveBeenCalledTimes(1);
  });

  test("passes correct envelope fields to sendEnvelope", async () => {
    const evt = makeEvent({ eventType: "SALARY_UPDATE", aggregateId: "emp-42", idempotencyKey: "idem-99" });
    mockFindMany.mockResolvedValue([evt]);

    await dispatchToEmpeo();

    const [envelope] = mockSendEnvelope.mock.calls[0];
    expect(envelope.eventType).toBe("SALARY_UPDATE");
    expect(envelope.aggregateId).toBe("emp-42");
    expect(envelope.idempotencyKey).toBe("idem-99");
    expect(typeof envelope.emittedAt).toBe("string");
  });
});

describe("dispatchToEmpeo — failure path", () => {
  test("marks event failed on non-ok HTTP response", async () => {
    mockFindMany.mockResolvedValue([makeEvent()]);
    mockSendEnvelope.mockResolvedValue({ ok: false, status: 503, body: "Service Unavailable" });

    const result = await dispatchToEmpeo();

    expect(result).toMatchObject({ consumed: 0, failed: 1 });
    expect(mockMarkFailed).toHaveBeenCalledWith("evt-1", expect.stringContaining("503"));
    expect(mockMarkConsumed).not.toHaveBeenCalled();
  });

  test("marks event failed on network error (thrown exception)", async () => {
    mockFindMany.mockResolvedValue([makeEvent()]);
    mockSendEnvelope.mockRejectedValue(new Error("ECONNREFUSED"));

    const result = await dispatchToEmpeo();

    expect(result).toMatchObject({ consumed: 0, failed: 1 });
    expect(mockMarkFailed).toHaveBeenCalledWith("evt-1", expect.stringContaining("ECONNREFUSED"));
  });

  test("skips events that have reached MAX_ATTEMPTS (5)", async () => {
    mockFindMany.mockResolvedValue([makeEvent({ attempts: 5 })]);

    const result = await dispatchToEmpeo();

    expect(result).toMatchObject({ skipped: 1, consumed: 0, failed: 0 });
    expect(mockSendEnvelope).not.toHaveBeenCalled();
  });
});

describe("dispatchToEmpeo — mixed batch", () => {
  test("processes success, failure, and skip in one batch", async () => {
    mockFindMany.mockResolvedValue([
      makeEvent({ id: "ok-1" }),
      makeEvent({ id: "fail-1" }),
      makeEvent({ id: "skip-1", attempts: 5 }),
    ]);
    mockSendEnvelope
      .mockResolvedValueOnce({ ok: true, status: 200, body: "ok" })
      .mockResolvedValueOnce({ ok: false, status: 500, body: "error" });

    const result = await dispatchToEmpeo();

    expect(result).toMatchObject({ processed: 3, consumed: 1, failed: 1, skipped: 1 });
    expect(mockWriteAuditLog).toHaveBeenCalledTimes(1);
  });
});
