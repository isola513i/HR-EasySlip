import { describe, test, expect, mock, beforeEach, spyOn } from "bun:test";

// ── Mock Prisma ──────────────────────────────────────────────
const mockLeaveRequestFindUnique = mock((): Promise<unknown> => Promise.resolve(null));

const mockPrismaClient = {
  leaveRequest: { findUnique: mockLeaveRequestFindUnique },
};

mock.module("@/lib/prisma", () => ({
  getPrisma: async () => mockPrismaClient,
}));

// ── Mock Control Plane (user-email lookup) ───────────────────
const mockUserFindUnique = mock((): Promise<unknown> => Promise.resolve(null));
mock.module("@/lib/db/control-plane", () => ({
  getControlPlane: () => ({
    user: { findUnique: mockUserFindUnique },
  }),
}));

// ── Mock notification-service (the seam the sender writes through) ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSendNotificationEmail = mock((): Promise<any> => Promise.resolve(undefined));
mock.module("./notification-service", () => ({
  sendNotificationEmail: mockSendNotificationEmail,
}));

// ── Stub push sender to no-op (fire-and-forget side channel) ──
mock.module("@/lib/push/push-service", () => ({
  sendPushToUser: mock(() => Promise.resolve()),
}));

// ── Import after mocks ──────────────────────────────────────
const { notifyLeaveSubmitted, notifyLeaveDecision } = await import("./leave-notification-sender");

const mockRequest = {
  id: "lr-1",
  leaveType: "SICK",
  startDate: new Date("2026-04-28"),
  endDate: new Date("2026-04-29"),
  daysRequested: { toString: () => "2.0" },
  reason: "Medical check-up",
  rejectedReason: null,
  employee: {
    firstNameTh: "สุดา",
    lastNameTh: "ทองดี",
    employeeCode: "ES0011",
    userId: "u-emp-1",
    notifyApproval: true,
  },
  approver: { userId: "u-mgr-1", notifyLeave: true },
};

beforeEach(() => {
  mockLeaveRequestFindUnique.mockReset();
  mockUserFindUnique.mockReset();
  mockSendNotificationEmail.mockReset().mockResolvedValue(undefined);
});

describe("notifyLeaveSubmitted", () => {
  test("sends email to approver with correct params", async () => {
    mockLeaveRequestFindUnique.mockResolvedValueOnce(mockRequest);
    mockUserFindUnique.mockResolvedValueOnce({ email: "manager@test.com" });

    await notifyLeaveSubmitted("lr-1");

    expect(mockSendNotificationEmail).toHaveBeenCalledTimes(1);
    const call = mockSendNotificationEmail.mock.calls[0] as unknown as [
      string,
      string,
      string,
      string,
    ];
    expect(call[0]).toBe("manager@test.com");
    expect(call[1]).toContain("สุดา ทองดี");
  });

  test("missing approver → does NOT send", async () => {
    mockLeaveRequestFindUnique.mockResolvedValueOnce({ ...mockRequest, approver: null });

    await expect(notifyLeaveSubmitted("lr-1")).resolves.toBeUndefined();
    expect(mockSendNotificationEmail).not.toHaveBeenCalled();
  });
});

describe("notifyLeaveDecision", () => {
  test("APPROVED → sends approval email to employee", async () => {
    mockLeaveRequestFindUnique.mockResolvedValueOnce(mockRequest);
    mockUserFindUnique.mockResolvedValueOnce({ email: "emp@test.com" });

    await notifyLeaveDecision("lr-1", "APPROVED");

    expect(mockSendNotificationEmail).toHaveBeenCalledTimes(1);
    const call = mockSendNotificationEmail.mock.calls[0] as unknown as [string, string];
    expect(call[1]).toContain("approved");
  });

  test("REJECTED → sends rejection email with reason", async () => {
    mockLeaveRequestFindUnique.mockResolvedValueOnce({
      ...mockRequest,
      rejectedReason: "Insufficient coverage",
    });
    mockUserFindUnique.mockResolvedValueOnce({ email: "emp@test.com" });

    await notifyLeaveDecision("lr-1", "REJECTED");

    expect(mockSendNotificationEmail).toHaveBeenCalledTimes(1);
    const call = mockSendNotificationEmail.mock.calls[0] as unknown as [string, string];
    expect(call[1]).toContain("rejected");
  });

  test("notification-service failure → logs error, does NOT throw", async () => {
    mockLeaveRequestFindUnique.mockResolvedValueOnce(mockRequest);
    mockUserFindUnique.mockResolvedValueOnce({ email: "emp@test.com" });
    mockSendNotificationEmail.mockRejectedValueOnce(new Error("rate limited"));

    const spy = spyOn(console, "error").mockImplementation(() => {});
    await expect(notifyLeaveDecision("lr-1", "APPROVED")).resolves.toBeUndefined();
    spy.mockRestore();
  });
});
