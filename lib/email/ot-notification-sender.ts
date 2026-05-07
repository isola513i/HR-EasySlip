import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "./notification-service";
import { otSubmittedHtml, otSubmittedText } from "./ot-submitted-template";
import { otDecisionHtml, otDecisionText } from "./ot-decision-template";
import { sendPushToUser } from "@/lib/push/push-service";

const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatOTType(type: string): string {
  return type === "WEEKDAY" ? "Weekday OT (1.5×)" : "Holiday OT (3.0×)";
}

export async function notifyOTSubmitted(requestId: string): Promise<void> {
  try {
    const req = await prisma.overtimeRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: { select: { firstNameTh: true, lastNameTh: true, employeeCode: true } },
        approver: { select: { notifyLeave: true, user: { select: { email: true } } } },
      },
    });
    if (!req?.approver?.user?.email) return;
    if (req.approver.notifyLeave === false) return;

    const params = {
      employeeName: `${req.employee.firstNameTh} ${req.employee.lastNameTh}`,
      employeeCode: req.employee.employeeCode,
      otType: formatOTType(req.overtimeType),
      date: fmtDate(req.date),
      hours: Number(req.hoursApproved).toFixed(1),
      reason: req.reason ?? "-",
      appUrl: APP_URL,
    };

    await sendNotificationEmail(
      req.approver.user.email,
      `[EasySlip] New OT request from ${params.employeeName}`,
      otSubmittedHtml(params),
      otSubmittedText(params),
    );
  } catch (err) {
    console.error("[notifyOTSubmitted]", err);
  }
}

export async function notifyOTDecision(
  requestId: string,
  decision: "APPROVED" | "REJECTED",
): Promise<void> {
  try {
    const req = await prisma.overtimeRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          select: {
            firstNameTh: true,
            lastNameTh: true,
            notifyApproval: true,
            userId: true,
            user: { select: { email: true } },
          },
        },
      },
    });
    if (!req?.employee?.user?.email) return;
    if (req.employee.notifyApproval === false) return;

    sendPushToUser(req.employee.userId, {
      title: decision === "APPROVED" ? "OT approved" : "OT rejected",
      body: `${formatOTType(req.overtimeType)} · ${fmtDate(req.date)} · ${Number(req.hoursApproved).toFixed(1)} hrs`,
      url: "/employee/inbox",
      tag: `ot-${requestId}`,
    }).catch(() => {});

    const params = {
      employeeName: `${req.employee.firstNameTh} ${req.employee.lastNameTh}`,
      otType: formatOTType(req.overtimeType),
      date: fmtDate(req.date),
      hours: Number(req.hoursApproved).toFixed(1),
      decision,
      rejectedReason: req.rejectedReason ?? undefined,
      appUrl: APP_URL,
    };

    const subject = decision === "APPROVED"
      ? `[EasySlip] OT approved — ${params.date}`
      : `[EasySlip] OT rejected — ${params.date}`;

    await sendNotificationEmail(
      req.employee.user.email,
      subject,
      otDecisionHtml(params),
      otDecisionText(params),
    );
  } catch (err) {
    console.error("[notifyOTDecision]", err);
  }
}
