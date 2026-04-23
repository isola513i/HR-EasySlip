// ════════════════════════════════════════════════════════════════
// EasySlip HR — Magic Link Email Template (TH/EN bilingual)
// ────────────────────────────────────────────────────────────────
// Inline CSS only — email clients strip <style> tags.
// Tested targets: Gmail, Outlook, Apple Mail, Samsung Mail.
// ════════════════════════════════════════════════════════════════

interface MagicLinkEmailParams {
  url: string;
  host: string;
  /** Expiry in human-readable form, e.g. "24 ชั่วโมง" */
  expiresIn?: string;
}

import { BRAND as _B } from "./brand";
const BRAND = { ..._B, cardBg: _B.card } as const;

export function magicLinkHtml({
  url,
  host,
  expiresIn = "24 ชั่วโมง",
}: MagicLinkEmailParams): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>เข้าสู่ระบบ ${BRAND.name}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;">

          <!-- Logo / Brand -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:24px;font-weight:700;color:${BRAND.color};letter-spacing:-0.5px;">
                ${BRAND.name}
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:${BRAND.cardBg};border:1px solid ${BRAND.border};border-radius:12px;padding:32px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                <!-- Thai section -->
                <tr>
                  <td style="padding-bottom:8px;">
                    <p style="margin:0;font-size:16px;font-weight:600;color:${BRAND.color};">
                      เข้าสู่ระบบ
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:24px;">
                    <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.muted};">
                      กดปุ่มด้านล่างเพื่อเข้าสู่ระบบ ${BRAND.name}
                      ลิงก์นี้ใช้ได้ครั้งเดียวและจะหมดอายุภายใน ${expiresIn}
                    </p>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:8px;background-color:${BRAND.accent};">
                          <a href="${url}" target="_blank" style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                            เข้าสู่ระบบ / Sign In
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding-bottom:20px;">
                    <hr style="border:none;border-top:1px solid ${BRAND.border};margin:0;" />
                  </td>
                </tr>

                <!-- English section -->
                <tr>
                  <td style="padding-bottom:4px;">
                    <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.muted};">
                      Click the button above to sign in to ${BRAND.name}.
                      This link is single-use and expires in ${expiresIn}.
                    </p>
                  </td>
                </tr>

                <!-- Security note -->
                <tr>
                  <td style="padding-top:16px;">
                    <p style="margin:0;font-size:12px;line-height:1.5;color:${BRAND.muted};">
                      หากคุณไม่ได้ขอเข้าสู่ระบบ กรุณาเพิกเฉยอีเมลนี้<br />
                      If you did not request this, please ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:${BRAND.muted};">
                ${BRAND.name} &middot; ${host}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function magicLinkText({
  url,
  host,
  expiresIn = "24 ชั่วโมง",
}: MagicLinkEmailParams): string {
  return [
    `เข้าสู่ระบบ ${BRAND.name}`,
    `Sign in to ${BRAND.name}`,
    "",
    `กดลิงก์ด้านล่าง / Click the link below:`,
    url,
    "",
    `ลิงก์นี้ใช้ได้ครั้งเดียวและหมดอายุภายใน ${expiresIn}`,
    `This link is single-use and expires in ${expiresIn}.`,
    "",
    `หากคุณไม่ได้ขอเข้าสู่ระบบ กรุณาเพิกเฉยอีเมลนี้`,
    `If you did not request this, please ignore this email.`,
    "",
    `— ${BRAND.name} · ${host}`,
  ].join("\n");
}
