import { getPrisma } from "@/lib/prisma";
import { getControlPlane } from "@/lib/db/control-plane";
import { sendNotificationEmail } from "./notification-service";
import { otSubmittedHtml, otSubmittedText } from "./ot-submitted-template";
import { otDecisionHtml, otDecisionText } from "./ot-decision-template";
import { formatEmailDate } from "./utils";
import { sendPushToUser } from "@/lib/push/push-service";
import { logger } from "@/lib/observability/logger";
import { formatOTType } from "@/lib/utils";

const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

async function getUserEmail(userId: string): Promise<string | null> {
  const cp = getControlPlane();
  const u = await cp.user.findUnique({ where: { id: userId }, select: { email: true } });
  return u?.email ?? null;
}

export async function notifyOTSubmitted(requestId: string): Promise<void> {
  try {
    const prisma = await getPrisma();
    const req = await prisma.overtimeRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: { select: { firstNameTh: true, lastNameTh: true, employeeCode: true } },
        approver: { select: { userId: true, notifyLeave: true } },
      },
    });
    if (!req?.approver?.userId) return;
    if (req.approver.notifyLeave === false) return;

    const approverEmail = await getUserEmail(req.approver.userId);
    if (!approverEmail) return;

    const params = {
      employeeName: `${req.employee.firstNameTh} ${req.employee.lastNameTh}`,
      employeeCode: req.employee.employeeCode,
      otType: formatOTType(req.overtimeType),
      date: formatEmailDate(req.date),
      hours: req.hoursApproved ? Number(req.hoursApproved).toFixed(1) : "0.0",
      reason: req.reason ?? "-",
      appUrl: APP_URL,
    };

    await sendNotificationEmail(
      approverEmail,
      `[EasySlip] New OT request from ${params.employeeName}`,
      otSubmittedHtml(params),
      otSubmittedText(params),
    );
  } catch (err) {
    logger.error("notifyOTSubmitted failed", { requestId, err: String(err) });
  }
}

export async function notifyOTDecision(
  requestId: string,
  decision: "APPROVED" | "REJECTED",
): Promise<void> {
  try {
    const prisma = await getPrisma();
    const req = await prisma.overtimeRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          select: {
            firstNameTh: true,
            lastNameTh: true,
            notifyApproval: true,
            userId: true,
          },
        },
      },
    });
    if (!req?.employee?.userId) return;
    if (req.employee.notifyApproval === false) return;

    const employeeEmail = await getUserEmail(req.employee.userId);
    if (!employeeEmail) return;

    // For REJECTED requests, suppress the hours line.
    const showHours = decision === "APPROVED" && req.hoursApproved !== null;
    const hoursLabel = showHours ? Number(req.hoursApproved).toFixed(1) : null;

    // Fire-and-forget push (best-effort; falls through if VAPID not set).
    sendPushToUser(req.employee.userId, {
      title: decision === "APPROVED" ? "OT approved" : "OT rejected",
      body: hoursLabel
        ? `${formatOTType(req.overtimeType)} · ${formatEmailDate(req.date)} · ${hoursLabel} hrs`
        : `${formatOTType(req.overtimeType)} · ${formatEmailDate(req.date)}`,
      url: "/employee/inbox",
      tag: `ot-${requestId}`,
    }).catch(() => {});

    const params = {
      employeeName: `${req.employee.firstNameTh} ${req.employee.lastNameTh}`,
      otType: formatOTType(req.overtimeType),
      date: formatEmailDate(req.date),
      hours: hoursLabel,
      decision,
      rejectedReason: req.rejectedReason ?? undefined,
      appUrl: APP_URL,
    };

    const subject = decision === "APPROVED"
      ? `[EasySlip] OT approved — ${params.date}`
      : `[EasySlip] OT rejected — ${params.date}`;

    await sendNotificationEmail(
      employeeEmail,
      subject,
      otDecisionHtml(params),
      otDecisionText(params),
    );
  } catch (err) {
    logger.error("notifyOTDecision failed", { requestId, decision, err: String(err) });
  }
}
