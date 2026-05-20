import { BRAND } from "./brand";

interface Params {
  tenantName: string;
  platformEmail: string;
  reason: string;
  expectedDurationMin: number;
  approveUrl: string;
  rejectUrl: string;
  expiresAt: Date;
}

export function impersonationRequestHtml(p: Params): string {
  const expiresStr = p.expiresAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
  return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
  <tr><td align="center" style="padding-bottom:24px;font-size:24px;font-weight:700;color:${BRAND.color};">${BRAND.name}</td></tr>
  <tr><td style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;padding:28px;">
    <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:${BRAND.color};">คำขอเข้าถึงระบบจากทีม Support</p>
    <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:${BRAND.color};">Platform Support Access Request</p>
    <p style="margin:0 0 20px;font-size:13px;color:${BRAND.muted};">
      ทีม EasySlip Support ต้องการเข้าถึงพื้นที่ทำงาน <strong>${p.tenantName}</strong> ชั่วคราว<br/>
      EasySlip Support has requested temporary access to <strong>${p.tenantName}</strong>
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:${BRAND.color};border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:${BRAND.muted};border-bottom:1px solid ${BRAND.border};">Support Email</td><td style="padding:6px 0;text-align:right;font-weight:600;border-bottom:1px solid ${BRAND.border};">${p.platformEmail}</td></tr>
      <tr><td style="padding:6px 0;color:${BRAND.muted};border-bottom:1px solid ${BRAND.border};">เหตุผล / Reason</td><td style="padding:6px 0;text-align:right;border-bottom:1px solid ${BRAND.border};">${p.reason}</td></tr>
      <tr><td style="padding:6px 0;color:${BRAND.muted};border-bottom:1px solid ${BRAND.border};">ระยะเวลา / Duration</td><td style="padding:6px 0;text-align:right;font-weight:600;border-bottom:1px solid ${BRAND.border};">${p.expectedDurationMin} นาที / min</td></tr>
      <tr><td style="padding:6px 0;color:${BRAND.muted};">คำขอหมดอายุ / Expires</td><td style="padding:6px 0;text-align:right;">${expiresStr}</td></tr>
    </table>
    <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:12px;margin:20px 0;font-size:12px;color:#713f12;">
      ⚠️ ถ้าคุณไม่ได้คาดหวังคำขอนี้ กรุณากด "ปฏิเสธ" ทันที<br/>
      If you did not expect this request, click Reject immediately.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:8px;">
          <a href="${p.approveUrl}" target="_blank" style="display:block;padding:12px 0;border-radius:8px;background:${BRAND.accent};font-size:14px;font-weight:600;color:#fff;text-align:center;text-decoration:none;">
            ✅ อนุมัติ / Approve
          </a>
        </td>
        <td style="padding-left:8px;">
          <a href="${p.rejectUrl}" target="_blank" style="display:block;padding:12px 0;border-radius:8px;background:#dc2626;font-size:14px;font-weight:600;color:#fff;text-align:center;text-decoration:none;">
            ❌ ปฏิเสธ / Reject
          </a>
        </td>
      </tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding-top:24px;font-size:11px;color:${BRAND.muted};">${BRAND.name} · Security notification — do not ignore</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

export function impersonationRequestText(p: Params): string {
  const expiresStr = p.expiresAt.toISOString();
  return [
    `${BRAND.name} — คำขอเข้าถึงระบบจากทีม Support / Platform Support Access Request`,
    "",
    `Support: ${p.platformEmail}`,
    `เหตุผล / Reason: ${p.reason}`,
    `ระยะเวลา / Duration: ${p.expectedDurationMin} min`,
    `คำขอหมดอายุ / Expires: ${expiresStr}`,
    "",
    `✅ อนุมัติ / Approve: ${p.approveUrl}`,
    `❌ ปฏิเสธ / Reject: ${p.rejectUrl}`,
    "",
    "ถ้าไม่ได้คาดหวังคำขอนี้ กรุณาปฏิเสธทันที",
    "If you did not expect this request, click Reject immediately.",
  ].join("\n");
}
