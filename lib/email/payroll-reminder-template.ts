import { BRAND as _B, unsubscribeFooterHtml, unsubscribeFooterText } from "./brand";

const BRAND = { ..._B, dark: _B.color } as const;

export type ReminderKind = "T3" | "T1" | "DDAY";

export interface PayrollReminderParams {
  kind: ReminderKind;
  cutoffDateLabel: string; // dd MMM yyyy
  monthLabel: string;      // เช่น "พฤษภาคม 2569 / May 2026"
  pendingOt: number;
  pendingLeave: number;
  pendingExpense: number;
  missingSalary: number;
  appUrl: string;
}

const TITLE_BY_KIND: Record<ReminderKind, { th: string; en: string }> = {
  T3:   { th: "อีก 3 วันถึงวัน cut-off",       en: "3 days to payroll cut-off" },
  T1:   { th: "พรุ่งนี้คือวัน cut-off",         en: "Cut-off is tomorrow" },
  DDAY: { th: "วันนี้คือวัน cut-off — ส่ง Empeo", en: "Cut-off today — export to Empeo" },
};

const ACTION_BY_KIND: Record<ReminderKind, { label: string; path: string }> = {
  T3:   { label: "Review pending approvals", path: "/hr/dashboard" },
  T1:   { label: "Final review",             path: "/hr/dashboard" },
  DDAY: { label: "Lock cycle & export",      path: "/hr/payroll" },
};

export function payrollReminderHtml(p: PayrollReminderParams): string {
  const t = TITLE_BY_KIND[p.kind];
  const a = ACTION_BY_KIND[p.kind];
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
    <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:${BRAND.dark};">${t.th} / ${t.en}</p>
    <p style="margin:0 0 20px;font-size:13px;color:${BRAND.muted};">
      งวดเงินเดือน: ${p.monthLabel}<br/>
      Cut-off date: <strong>${p.cutoffDateLabel}</strong>
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:${BRAND.dark};border-top:1px solid ${BRAND.border};">
      <tr><td style="padding:8px 0;color:${BRAND.muted};">Pending OT</td><td style="padding:8px 0;text-align:right;font-weight:600;">${p.pendingOt}</td></tr>
      <tr><td style="padding:8px 0;color:${BRAND.muted};">Pending Leave</td><td style="padding:8px 0;text-align:right;font-weight:600;">${p.pendingLeave}</td></tr>
      <tr><td style="padding:8px 0;color:${BRAND.muted};">Pending Expense</td><td style="padding:8px 0;text-align:right;font-weight:600;">${p.pendingExpense}</td></tr>
    </table>
    ${showSalaryWarn ? `
    <p style="margin:16px 0 0;padding:10px 12px;background:#FEF3C7;border:1px solid #FCD34D;border-radius:8px;font-size:12px;color:#78350F;">
      ⚠️ พนักงาน ${p.missingSalary} คนยังไม่ตั้งค่า baseSalary — OT ใน Empeo จะเป็น 0
    </p>` : ""}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 0;">
      <tr><td style="border-radius:8px;background:${BRAND.accent};">
        <a href="${p.appUrl}${a.path}" target="_blank" style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;">
          ${a.label}
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
  const t = TITLE_BY_KIND[p.kind];
  const a = ACTION_BY_KIND[p.kind];
  const lines = [
    `${BRAND.name} — ${t.th} / ${t.en}`,
    "",
    `งวดเงินเดือน: ${p.monthLabel}`,
    `Cut-off: ${p.cutoffDateLabel}`,
    "",
    `Pending OT: ${p.pendingOt}`,
    `Pending Leave: ${p.pendingLeave}`,
    `Pending Expense: ${p.pendingExpense}`,
  ];
  if (p.missingSalary > 0) {
    lines.push("", `⚠ ${p.missingSalary} employee(s) missing baseSalary — Empeo OT will export 0`);
  }
  lines.push("", `${a.label}: ${p.appUrl}${a.path}`, unsubscribeFooterText(p.appUrl));
  return lines.join("\n");
}

export function payrollReminderSubject(p: PayrollReminderParams): string {
  const t = TITLE_BY_KIND[p.kind];
  return `[EasySlip HR] ${t.th} (${p.cutoffDateLabel})`;
}
