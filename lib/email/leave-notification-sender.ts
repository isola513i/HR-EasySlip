import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "./notification-service";
import { leaveSubmittedHtml, leaveSubmittedText } from "./leave-submitted-template";
import { leaveDecisionHtml, leaveDecisionText } from "./leave-decision-template";
import { formatEmailDate } from "./utils";
import { sendPushToUser } from "@/lib/push/push-service";
import { logger } from "@/lib/observability/logger";
import { formatLeaveType } from "@/lib/utils";

const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function notifyLeaveSubmitted(requestId: string): Promise<void> {
  try {
    const req = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: { select: { firstNameTh: true, lastNameTh: true, employeeCode: true } },
        approver: { select: { notifyLeave: true, user: { select: { email: true } } } },
      },
    });
    if (!req?.approver?.user?.email) return;
    if (req.approver.notifyLeave === false) return;
    const approverEmail = req.approver.user.email;

    const params = {
      employeeName: `${req.employee.firstNameTh} ${req.employee.lastNameTh}`,
      employeeCode: req.employee.employeeCode,
      leaveType: formatLeaveType(req.leaveType),
      startDate: formatEmailDate(req.startDate),
      endDate: formatEmailDate(req.endDate),
      days: req.daysRequested.toString(),
      reason: req.reason,
      appUrl: APP_URL,
    };

    await sendNotificationEmail(
      approverEmail,
      `[EasySlip] New leave request from ${params.employeeName}`,
      leaveSubmittedHtml(params),
      leaveSubmittedText(params),
    );
  } catch (err) {
    logger.error("notifyLeaveSubmitted failed", { requestId, err: String(err) });
  }
}

export async function notifyLeaveDecision(
  requestId: string,
  decision: "APPROVED" | "REJECTED",
): Promise<void> {
  try {
    const req = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          select: { firstNameTh: true, lastNameTh: true, notifyApproval: true, userId: true, user: { select: { email: true } } },
        },
      },
    });
    if (!req?.employee?.user?.email) return;
    if (req.employee.notifyApproval === false) return;
    const employeeEmail = req.employee.user.email;

    // Fire-and-forget push (best-effort; falls through if VAPID not set).
    sendPushToUser(req.employee.userId, {
      title: decision === "APPROVED" ? "Leave approved" : "Leave rejected",
      body: `${formatLeaveType(req.leaveType)} · ${formatEmailDate(req.startDate)} → ${formatEmailDate(req.endDate)}`,
      url: "/employee/inbox",
      tag: `leave-${requestId}`,
    }).catch(() => {});

    const params = {
      employeeName: `${req.employee.firstNameTh} ${req.employee.lastNameTh}`,
      leaveType: formatLeaveType(req.leaveType),
      startDate: formatEmailDate(req.startDate),
      endDate: formatEmailDate(req.endDate),
      days: req.daysRequested.toString(),
      decision,
      rejectedReason: req.rejectedReason ?? undefined,
      appUrl: APP_URL,
    };

    const subject = decision === "APPROVED"
      ? `[EasySlip] Leave approved — ${params.leaveType}`
      : `[EasySlip] Leave rejected — ${params.leaveType}`;

    await sendNotificationEmail(
      employeeEmail,
      subject,
      leaveDecisionHtml(params),
      leaveDecisionText(params),
    );
  } catch (err) {
    logger.error("notifyLeaveDecision failed", { requestId, decision, err: String(err) });
  }
}
