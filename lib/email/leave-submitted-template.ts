interface Params {
  employeeName: string;
  employeeCode: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: string;
  reason: string;
  appUrl: string;
}

import { BRAND as _B } from "./brand";
const BRAND = { ..._B, dark: _B.color } as const;

export function leaveSubmittedHtml(p: Params): string {
  return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
  <tr><td align="center" style="padding-bottom:24px;font-size:24px;font-weight:700;color:${BRAND.dark};">${BRAND.name}</td></tr>
  <tr><td style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;padding:28px;">
    <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:${BRAND.dark};">มีคำขอลาใหม่ / New Leave Request</p>
    <p style="margin:0 0 20px;font-size:14px;color:${BRAND.muted};">
      ${p.employeeName} (${p.employeeCode}) ยื่นคำขอลา${p.leaveType}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:${BRAND.dark};">
      <tr><td style="padding:6px 0;color:${BRAND.muted};">Type</td><td style="padding:6px 0;text-align:right;font-weight:600;">${p.leaveType}</td></tr>
      <tr><td style="padding:6px 0;color:${BRAND.muted};">Dates</td><td style="padding:6px 0;text-align:right;font-weight:600;">${p.startDate} – ${p.endDate}</td></tr>
      <tr><td style="padding:6px 0;color:${BRAND.muted};">Days</td><td style="padding:6px 0;text-align:right;font-weight:600;">${p.days}</td></tr>
      <tr><td style="padding:6px 0;color:${BRAND.muted};">Reason</td><td style="padding:6px 0;text-align:right;">${p.reason}</td></tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px auto 0;">
      <tr><td style="border-radius:8px;background:${BRAND.accent};">
        <a href="${p.appUrl}/manager/inbox" target="_blank" style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;">
          Review Request
        </a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding-top:24px;font-size:11px;color:${BRAND.muted};">${BRAND.name}</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

export function leaveSubmittedText(p: Params): string {
  return [
    `${BRAND.name} — มีคำขอลาใหม่ / New Leave Request`,
    "",
    `${p.employeeName} (${p.employeeCode})`,
    `Type: ${p.leaveType}`,
    `Dates: ${p.startDate} – ${p.endDate}`,
    `Days: ${p.days}`,
    `Reason: ${p.reason}`,
    "",
    `Review: ${p.appUrl}/manager/inbox`,
  ].join("\n");
}
