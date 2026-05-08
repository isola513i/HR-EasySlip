import enDict from "@/lib/i18n/dictionaries/en";
import thDict from "@/lib/i18n/dictionaries/th";
import { BRAND as _B, unsubscribeFooterHtml, unsubscribeFooterText } from "./brand";

const BRAND = { ..._B, dark: _B.color } as const;

export type ReminderKind = "T3" | "T1" | "DDAY";

export interface PayrollReminderParams {
  kind: ReminderKind;
  cutoffDateLabel: string;
  monthLabel: string;
  pendingOt: number;
  pendingLeave: number;
  pendingExpense: number;
  missingSalary: number;
  appUrl: string;
}

const PATH_BY_KIND: Record<ReminderKind, string> = {
  T3: "/hr/dashboard",
  T1: "/hr/dashboard",
  DDAY: "/hr/payroll",
};

function withCount(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

export function payrollReminderHtml(p: PayrollReminderParams): string {
  const en = enDict.notifications.payrollCutoff;
  const th = thDict.notifications.payrollCutoff;
  const path = PATH_BY_KIND[p.kind];
  const showSalaryWarn = p.missingSalary > 0;

  return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
  <tr><td align="center" style="padding-bottom:24px;font-size:24px;font-weight:700;color:${BRAND.dark};">${BRAND.name}</td></tr>
  <tr><td style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;padding:28px;">
    <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:${BRAND.dark};">${th[p.kind].title} / ${en[p.kind].title}</p>
    <p style="margin:0 0 20px;font-size:13px;color:${BRAND.muted};">
      ${th.emailHeading.replace("{month}", p.monthLabel)} / ${en.emailHeading.replace("{month}", p.monthLabel)}<br/>
      ${th.emailCutoffLabel} / ${en.emailCutoffLabel}: <strong>${p.cutoffDateLabel}</strong>
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:${BRAND.dark};border-top:1px solid ${BRAND.border};">
      <tr><td style="padding:8px 0;color:${BRAND.muted};">${en.emailPendingOt}</td><td style="padding:8px 0;text-align:right;font-weight:600;">${p.pendingOt}</td></tr>
      <tr><td style="padding:8px 0;color:${BRAND.muted};">${en.emailPendingLeave}</td><td style="padding:8px 0;text-align:right;font-weight:600;">${p.pendingLeave}</td></tr>
      <tr><td style="padding:8px 0;color:${BRAND.muted};">${en.emailPendingExpense}</td><td style="padding:8px 0;text-align:right;font-weight:600;">${p.pendingExpense}</td></tr>
    </table>
    ${showSalaryWarn ? `
    <p style="margin:16px 0 0;padding:10px 12px;background:#FEF3C7;border:1px solid #FCD34D;border-radius:8px;font-size:12px;color:#78350F;">
      ${withCount(th.bodySalaryWarn, p.missingSalary)}<br/>${withCount(en.bodySalaryWarn, p.missingSalary)}
    </p>` : ""}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 0;">
      <tr><td style="border-radius:8px;background:${BRAND.accent};">
        <a href="${p.appUrl}${path}" target="_blank" style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;">
          ${en[p.kind].action}
        </a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding-top:24px;font-size:11px;color:${BRAND.muted};">${BRAND.name}</td></tr>
  ${unsubscribeFooterHtml(p.appUrl)}
</table>
</td></tr>
</table>
</body></html>`;
}

export function payrollReminderText(p: PayrollReminderParams): string {
  const en = enDict.notifications.payrollCutoff;
  const th = thDict.notifications.payrollCutoff;
  const path = PATH_BY_KIND[p.kind];
  const lines = [
    `${BRAND.name} — ${th[p.kind].title} / ${en[p.kind].title}`,
    "",
    th.emailHeading.replace("{month}", p.monthLabel),
    `${en.emailCutoffLabel}: ${p.cutoffDateLabel}`,
    "",
    `${en.emailPendingOt}: ${p.pendingOt}`,
    `${en.emailPendingLeave}: ${p.pendingLeave}`,
    `${en.emailPendingExpense}: ${p.pendingExpense}`,
  ];
  if (p.missingSalary > 0) {
    lines.push("", withCount(en.bodySalaryWarn, p.missingSalary));
  }
  lines.push("", `${en[p.kind].action}: ${p.appUrl}${path}`, unsubscribeFooterText(p.appUrl));
  return lines.join("\n");
}

export function payrollReminderSubject(p: PayrollReminderParams): string {
  const th = thDict.notifications.payrollCutoff;
  return `[EasySlip HR] ${th[p.kind].title} (${p.cutoffDateLabel})`;
}
