import { describe, test, expect, mock, beforeEach, spyOn } from "bun:test";

// ── Mock Prisma ──────────────────────────────────────────────
const mockLeaveRequestFindUnique = mock((): Promise<unknown> => Promise.resolve(null));

mock.module("@/lib/prisma", () => ({
  prisma: {
    leaveRequest: { findUnique: mockLeaveRequestFindUnique },
  },
}));

// ── Mock Resend ──────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSendEmail = mock((): Promise<any> => Promise.resolve({ data: { id: "email-1" }, error: null }));

mock.module("resend", () => ({
  Resend: class { emails = { send: mockSendEmail }; },
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
  employee: { firstNameTh: "สุดา", lastNameTh: "ทองดี", employeeCode: "ES0011", user: { email: "emp@test.com" } },
  approver: { user: { email: "manager@test.com" } },
};

beforeEach(() => {
  mockLeaveRequestFindUnique.mockReset();
  mockSendEmail.mockReset();
  mockSendEmail.mockResolvedValue({ data: { id: "email-1" }, error: null });
});

describe("notifyLeaveSubmitted", () => {
  test("sends email to approver with correct params", async () => {
    mockLeaveRequestFindUnique.mockResolvedValueOnce(mockRequest);

    await notifyLeaveSubmitted("lr-1");

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const call = mockSendEmail.mock.calls[0] as unknown as [{ to: string; subject: string }];
    expect(call[0].to).toBe("manager@test.com");
    expect(call[0].subject).toContain("สุดา ทองดี");
  });

  test("missing approver → does NOT throw", async () => {
    mockLeaveRequestFindUnique.mockResolvedValueOnce({ ...mockRequest, approver: null });

    await expect(notifyLeaveSubmitted("lr-1")).resolves.toBeUndefined();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});

describe("notifyLeaveDecision", () => {
  test("APPROVED → sends approval email to employee", async () => {
    mockLeaveRequestFindUnique.mockResolvedValueOnce(mockRequest);

    await notifyLeaveDecision("lr-1", "APPROVED");

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const call = mockSendEmail.mock.calls[0] as unknown as [{ subject: string }];
    expect(call[0].subject).toContain("approved");
  });

  test("REJECTED → sends rejection email with reason", async () => {
    mockLeaveRequestFindUnique.mockResolvedValueOnce({
      ...mockRequest,
      rejectedReason: "Insufficient coverage",
    });

    await notifyLeaveDecision("lr-1", "REJECTED");

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const call = mockSendEmail.mock.calls[0] as unknown as [{ subject: string }];
    expect(call[0].subject).toContain("rejected");
  });

  test("Resend failure → logs error, does NOT throw", async () => {
    mockLeaveRequestFindUnique.mockResolvedValueOnce(mockRequest);
    mockSendEmail.mockResolvedValueOnce({ data: null, error: { message: "rate limited" } });

    const spy = spyOn(console, "error").mockImplementation(() => {});
    await expect(notifyLeaveDecision("lr-1", "APPROVED")).resolves.toBeUndefined();
    spy.mockRestore();
  });
});
