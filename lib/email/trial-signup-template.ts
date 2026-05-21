// ════════════════════════════════════════════════════════════════
// EasySlip HR — Trial Signup Email Templates (TH/EN bilingual)
// ────────────────────────────────────────────────────────────────
// Inline CSS only — email clients strip <style> tags.
// ════════════════════════════════════════════════════════════════

const PRIMARY = "#3d46cc";
const BG = "#f6f8fa";
const CARD = "#ffffff";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const TEXT = "#111827";
const BRAND_NAME = "EasySlip HR";

export interface TrialSignupEmailParams {
  companyName: string;
  contactName: string;
  contactEmail: string;
  desiredSlug: string;
  teamSize?: string;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:${MUTED};width:120px;">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:${TEXT};font-weight:500;">${value}</td>
  </tr>`;
}

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:22px;font-weight:700;color:${PRIMARY};letter-spacing:-0.5px;">${BRAND_NAME}</span>
            </td>
          </tr>
          <tr>
            <td style="background-color:${CARD};border:1px solid ${BORDER};border-radius:12px;padding:32px 28px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0;font-size:11px;color:${MUTED};">${BRAND_NAME} &middot; easyslip.app</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Confirmation email → sent to the person who signed up ────────

export function trialSignupConfirmationHtml(params: TrialSignupEmailParams): string {
  const { companyName, contactName, desiredSlug, teamSize } = params;
  const content = `
    <p style="margin:0 0 4px;font-size:22px;">🎉</p>
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:${TEXT};">รับคำขอของคุณแล้ว!</p>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:${MUTED};">
      สวัสดี ${contactName} — เราได้รับคำขอทดลองใช้ ${BRAND_NAME} สำหรับ <strong>${companyName}</strong> แล้ว
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background-color:${BG};border:1px solid ${BORDER};border-radius:8px;padding:16px;margin-bottom:24px;">
      <tbody>
        ${detailRow("บริษัท / Company", companyName)}
        ${detailRow("URL ของคุณ", `/${desiredSlug}`)}
        ${teamSize ? detailRow("ขนาดทีม / Team", teamSize) : ""}
      </tbody>
    </table>
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${TEXT};">
      <strong>ขั้นตอนถัดไป:</strong> เราจะ Setup บัญชีภายใน 24 ชั่วโมง และส่ง Link เข้าสู่ระบบไปยัง Email นี้
    </p>
    <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:${MUTED};">
      <em>Next steps: We'll set up your account within 24 hours and send a login link to this email.</em>
    </p>
    <hr style="border:none;border-top:1px solid ${BORDER};margin:0 0 20px;" />
    <p style="margin:0;font-size:13px;color:${MUTED};">
      มีคำถาม? ตอบกลับ Email นี้ได้เลย<br />
      <em>Questions? Just reply to this email.</em>
    </p>`;
  return baseLayout(content);
}

// ── Notification email → sent to EasySlip team ───────────────────

export function trialSignupNotificationHtml(params: TrialSignupEmailParams): string {
  const { companyName, contactName, contactEmail, desiredSlug, teamSize } = params;
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const content = `
    <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${PRIMARY};text-transform:uppercase;letter-spacing:0.5px;">New Trial Request</p>
    <p style="margin:0 0 24px;font-size:20px;font-weight:700;color:${TEXT};">${companyName}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background-color:${BG};border:1px solid ${BORDER};border-radius:8px;padding:16px;margin-bottom:24px;">
      <tbody>
        ${detailRow("Company", companyName)}
        ${detailRow("Contact", contactName)}
        ${detailRow("Email", contactEmail)}
        ${detailRow("Slug", `/${desiredSlug}`)}
        ${teamSize ? detailRow("Team size", teamSize) : ""}
        ${detailRow("Received", timestamp)}
      </tbody>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="border-radius:8px;background-color:${PRIMARY};">
          <a href="${appUrl}/platform/trials" target="_blank"
            style="display:inline-block;padding:10px 24px;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            Review at /platform/trials
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:12px;color:${MUTED};">This is an automated notification from ${BRAND_NAME}.</p>`;
  return baseLayout(content);
}
