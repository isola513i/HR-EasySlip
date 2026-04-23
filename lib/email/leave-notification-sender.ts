import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "./notification-service";
import { leaveSubmittedHtml, leaveSubmittedText } from "./leave-submitted-template";
import { leaveDecisionHtml, leaveDecisionText } from "./leave-decision-template";

import { formatLeaveType } from "@/lib/utils";

const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

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
      startDate: fmtDate(req.startDate),
      endDate: fmtDate(req.endDate),
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
    console.error("[notifyLeaveSubmitted]", err);
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
          select: { firstNameTh: true, lastNameTh: true, notifyApproval: true, user: { select: { email: true } } },
        },
      },
    });
    if (!req?.employee?.user?.email) return;
    if (req.employee.notifyApproval === false) return;
    const employeeEmail = req.employee.user.email;

    const params = {
      employeeName: `${req.employee.firstNameTh} ${req.employee.lastNameTh}`,
      leaveType: formatLeaveType(req.leaveType),
      startDate: fmtDate(req.startDate),
      endDate: fmtDate(req.endDate),
      days: req.daysRequested.toString(),
      decision,
      rejectedReason: req.rejectedReason ?? undefined,
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
    console.error("[notifyLeaveDecision]", err);
  }
}
