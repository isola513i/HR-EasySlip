interface Params {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: string;
  decision: "APPROVED" | "REJECTED";
  rejectedReason?: string;
  appUrl?: string;
}

import { BRAND as _B, unsubscribeFooterHtml, unsubscribeFooterText } from "./brand";
const BRAND = { ..._B, dark: _B.color } as const;

export function leaveDecisionHtml(p: Params): string {
  const approved = p.decision === "APPROVED";
  const color = approved ? BRAND.success : BRAND.error;
  const bg = approved ? BRAND.successBg : BRAND.errorBg;
  const thTitle = approved ? "คำขอลาได้รับการอนุมัติ" : "คำขอลาถูกปฏิเสธ";
  const enTitle = approved ? "Leave Request Approved" : "Leave Request Rejected";

  return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
  <tr><td align="center" style="padding-bottom:24px;font-size:24px;font-weight:700;color:${BRAND.dark};">${BRAND.name}</td></tr>
  <tr><td style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;padding:28px;">
    <div style="background:${bg};border-radius:8px;padding:16px;text-align:center;margin-bottom:20px;">
      <p style="margin:0;font-size:18px;font-weight:700;color:${color};">${thTitle}</p>
      <p style="margin:4px 0 0;font-size:13px;color:${color};">${enTitle}</p>
    </div>
    <p style="margin:0 0 16px;font-size:14px;color:${BRAND.muted};">
      สวัสดีคุณ${p.employeeName},
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:${BRAND.dark};">
      <tr><td style="padding:6px 0;color:${BRAND.muted};">Type</td><td style="padding:6px 0;text-align:right;font-weight:600;">${p.leaveType}</td></tr>
      <tr><td style="padding:6px 0;color:${BRAND.muted};">Dates</td><td style="padding:6px 0;text-align:right;font-weight:600;">${p.startDate} – ${p.endDate}</td></tr>
      <tr><td style="padding:6px 0;color:${BRAND.muted};">Days</td><td style="padding:6px 0;text-align:right;font-weight:600;">${p.days}</td></tr>
    </table>
    ${!approved && p.rejectedReason ? `
    <div style="margin-top:16px;padding:12px;background:${BRAND.errorBg};border-radius:6px;border:1px solid #fecaca;">
      <p style="margin:0;font-size:12px;font-weight:600;color:${BRAND.error};">เหตุผลที่ปฏิเสธ / Rejection Reason:</p>
      <p style="margin:4px 0 0;font-size:13px;color:${BRAND.dark};">${p.rejectedReason}</p>
    </div>` : ""}
  </td></tr>
  <tr><td align="center" style="padding-top:24px;font-size:11px;color:${BRAND.muted};">${BRAND.name}</td></tr>
  ${p.appUrl ? unsubscribeFooterHtml(p.appUrl) : ""}
</table>
</td></tr>
</table>
</body></html>`;
}

export function leaveDecisionText(p: Params): string {
  const approved = p.decision === "APPROVED";
  const lines = [
    `${BRAND.name} — ${approved ? "Leave Approved" : "Leave Rejected"}`,
    "",
    `สวัสดีคุณ${p.employeeName},`,
    "",
    `Type: ${p.leaveType}`,
    `Dates: ${p.startDate} – ${p.endDate}`,
    `Days: ${p.days}`,
  ];
  if (!approved && p.rejectedReason) {
    lines.push("", `Rejection reason: ${p.rejectedReason}`);
  }
  if (p.appUrl) lines.push(unsubscribeFooterText(p.appUrl));
  return lines.join("\n");
}
