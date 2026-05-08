import type { NotificationKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { logger } from "@/lib/observability/logger";
import { sendNotificationEmail } from "@/lib/email/notification-service";
import {
  payrollReminderHtml,
  payrollReminderText,
  payrollReminderSubject,
  type ReminderKind,
} from "@/lib/email/payroll-reminder-template";
import { createNotification } from "@/lib/notifications/notification-service";
import { HR_ROLES_FOR_REMINDERS } from "./payroll-reminders-constants";

interface ReminderPlan {
  kind: ReminderKind;
  notifKind: NotificationKind;
}

const KIND_TITLE_TH: Record<ReminderKind, string> = {
  T3:   "อีก 3 วันถึงวัน cut-off",
  T1:   "พรุ่งนี้คือวัน cut-off",
  DDAY: "วันนี้คือวัน cut-off — ส่ง Empeo",
};

/** Wall-clock day in Bangkok for the given UTC date. */
function bangkokDateOnly(d: Date): Date {
  const bkk = new Date(d.getTime() + 7 * 3600_000);
  return new Date(Date.UTC(bkk.getUTCFullYear(), bkk.getUTCMonth(), bkk.getUTCDate()));
}

function diffDaysBkk(target: Date, today: Date): number {
  const a = bangkokDateOnly(target).getTime();
  const b = bangkokDateOnly(today).getTime();
  return Math.round((a - b) / 86_400_000);
}

function planForToday(cutOffAt: Date, today: Date): ReminderPlan | null {
  const diff = diffDaysBkk(cutOffAt, today);
  if (diff === 3) return { kind: "T3", notifKind: "PAYROLL_CUTOFF_T3" };
  if (diff === 1) return { kind: "T1", notifKind: "PAYROLL_CUTOFF_T1" };
  if (diff === 0) return { kind: "DDAY", notifKind: "PAYROLL_CUTOFF_DDAY" };
  return null;
}

interface PendingCounts {
  pendingOt: number;
  pendingLeave: number;
  pendingExpense: number;
  missingSalary: number;
}

async function gatherPending(cycleId: string): Promise<PendingCounts> {
  const [pendingOt, pendingLeave, pendingExpense, missingSalary] = await Promise.all([
    prisma.overtimeRequest.count({ where: { status: "PENDING", payrollCycleId: cycleId } }),
    prisma.leaveRequest.count({ where: { status: "PENDING", payrollCycleId: cycleId } }),
    prisma.expenseClaim.count({ where: { status: "PENDING", payrollCycleId: cycleId } }),
    prisma.employee.count({ where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] }, baseSalary: null } }),
  ]);
  return { pendingOt, pendingLeave, pendingExpense, missingSalary };
}

interface RecipientRow {
  userId: string;
  email: string;
}

async function listHrRecipients(): Promise<RecipientRow[]> {
  const employees = await prisma.employee.findMany({
    where: {
      employmentStatus: { in: ["ACTIVE", "PROBATION"] },
      roles: { hasSome: [...HR_ROLES_FOR_REMINDERS] },
      user: { isDisabled: false },
    },
    select: { userId: true, user: { select: { email: true } } },
  });
  return employees
    .map((e) => (e.user ? { userId: e.userId, email: e.user.email } : null))
    .filter((r): r is RecipientRow => r !== null);
}

export interface PayrollRemindersResult {
  ranAt: string;
  cycleId: string | null;
  kind: ReminderKind | null;
  recipients: number;
  emailsSent: number;
  notificationsCreated: number;
  reason?: string;
}

/**
 * Send T-3 / T-1 / D-day cut-off reminders to HR. Idempotent: each
 * (user, kind, cycle) gets at most one notification — the cron can
 * safely re-run without spamming.
 */
export async function runPayrollReminders(now = new Date()): Promise<PayrollRemindersResult> {
  const ranAt = now.toISOString();

  const cycle = await prisma.payrollCycle.findFirst({
    where: { status: "OPEN" },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });
  if (!cycle) {
    return { ranAt, cycleId: null, kind: null, recipients: 0, emailsSent: 0, notificationsCreated: 0, reason: "No open cycle" };
  }

  const plan = planForToday(cycle.cutOffAt, now);
  if (!plan) {
    return { ranAt, cycleId: cycle.id, kind: null, recipients: 0, emailsSent: 0, notificationsCreated: 0, reason: "Not a reminder day" };
  }

  const [counts, recipients] = await Promise.all([gatherPending(cycle.id), listHrRecipients()]);
  if (recipients.length === 0) {
    return { ranAt, cycleId: cycle.id, kind: plan.kind, recipients: 0, emailsSent: 0, notificationsCreated: 0, reason: "No HR recipients" };
  }

  const cutoffDateLabel = bangkokDateOnly(cycle.cutOffAt).toISOString().slice(0, 10);
  const monthLabel = `${cycle.year}-${String(cycle.month).padStart(2, "0")}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://easyslip.app";

  const emailParams = {
    kind: plan.kind,
    cutoffDateLabel,
    monthLabel,
    pendingOt: counts.pendingOt,
    pendingLeave: counts.pendingLeave,
    pendingExpense: counts.pendingExpense,
    missingSalary: counts.missingSalary,
    appUrl,
  };
  const subject = payrollReminderSubject(emailParams);
  const html = payrollReminderHtml(emailParams);
  const text = payrollReminderText(emailParams);

  let emailsSent = 0;
  let notificationsCreated = 0;
  for (const r of recipients) {
    const dedupeKey = `${r.userId}:${plan.notifKind}:${cycle.id}`;
    try {
      // Idempotency: skip if a notification for this user+kind already
      // exists for this cycle. We encode the cycleId in the body's
      // first line to make matching cheap.
      const exists = await prisma.notification.findFirst({
        where: {
          userId: r.userId,
          kind: plan.notifKind,
          body: { startsWith: `cycle:${cycle.id}` },
        },
        select: { id: true },
      });
      if (exists) continue;

      await createNotification({
        userId: r.userId,
        kind: plan.notifKind,
        title: KIND_TITLE_TH[plan.kind],
        body: `cycle:${cycle.id}\n${monthLabel} • cut-off ${cutoffDateLabel}\nPending OT ${counts.pendingOt} · Leave ${counts.pendingLeave} · Expense ${counts.pendingExpense}${counts.missingSalary > 0 ? ` · Missing salary ${counts.missingSalary}` : ""}`,
        link: plan.kind === "DDAY" ? "/hr/payroll" : "/hr/dashboard",
      });
      notificationsCreated++;

      const ok = await sendNotificationEmail(r.email, subject, html, text);
      if (ok) emailsSent++;
    } catch (err) {
      logger.error("payroll-reminder failed for recipient", { dedupeKey, error: (err as Error).message });
    }
  }

  await writeAuditLog({
    actorId: null,
    action: "payroll.reminder_sent",
    entityType: "PayrollCycle",
    entityId: cycle.id,
    after: { kind: plan.kind, recipients: recipients.length, emailsSent, notificationsCreated, counts },
  });

  return { ranAt, cycleId: cycle.id, kind: plan.kind, recipients: recipients.length, emailsSent, notificationsCreated };
}
