import { z } from "zod";
import { getControlPlane } from "@/lib/db/control-plane";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { parseBody } from "@/lib/api/validate";
import { apiOk } from "@/lib/api/response";
import { sendNotificationEmail } from "@/lib/email/notification-service";
import { authEndpointLimiter } from "@/lib/security/rate-limit";
import { writeAuditLog } from "@/lib/audit/logger";

const ForgotPasswordSchema = z.object({ email: z.string().email() });

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export const POST = withApiHandler(async (req, ctx) => {
  const { email } = await parseBody(req, ForgotPasswordSchema);
  const emailLower = email.toLowerCase();
  const cp = getControlPlane();

  // Always return success to not reveal if email exists
  const successResponse = apiOk({ message: "ถ้ามีบัญชีอยู่ในระบบ จะได้รับอีเมลสำหรับรีเซ็ตรหัสผ่าน" });

  const user = await cp.user.findUnique({ where: { email: emailLower } });
  if (!user) return successResponse;

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + TOKEN_EXPIRY_MS);

  // Atomic replace: delete existing + create new in a single batched transaction
  await cp.$transaction([
    cp.verificationToken.deleteMany({ where: { identifier: `reset:${emailLower}` } }),
    cp.verificationToken.create({
      data: { identifier: `reset:${emailLower}`, token, expires },
    }),
  ]);

  // Audit outside the txn so an audit failure doesn't roll back the token
  writeAuditLog({
    actorId: user.id,
    action: "auth.password_reset_requested",
    entityType: "User",
    entityId: user.id,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  }).catch((err) => console.error("[forgot-password audit]", err));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/signin/reset-password?token=${token}&email=${encodeURIComponent(emailLower)}`;

  const sent = await sendNotificationEmail(
    emailLower,
    "รีเซ็ตรหัสผ่าน EasySlip HR",
    resetPasswordEmailHtml({ resetUrl }),
    `รีเซ็ตรหัสผ่าน EasySlip HR\n\nกดลิงก์ด้านล่างเพื่อรีเซ็ตรหัสผ่าน (หมดอายุใน 1 ชั่วโมง)\n\n${resetUrl}\n\nถ้าคุณไม่ได้ขอรีเซ็ตรหัสผ่าน ไม่ต้องทำอะไร`,
  );

  if (!sent) {
    console.error(`[forgot-password] Email delivery failed. Reset URL: /signin/reset-password?token=${token}&email=${encodeURIComponent(emailLower)}`);
  }

  return successResponse;
}, { rateLimit: authEndpointLimiter });

function resetPasswordEmailHtml({ resetUrl }: { resetUrl: string }): string {
  const PRIMARY = "#3d46cc";
  const MUTED = "#6b7280";
  const BORDER = "#e5e7eb";
  const BG = "#f6f8fa";
  const CARD = "#ffffff";
  const TEXT = "#111827";

  return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="utf-8" /><title>EasySlip HR</title></head>
<body style="margin:0;padding:0;background-color:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" style="max-width:480px;">
        <tr><td align="center" style="padding-bottom:24px;">
          <span style="font-size:22px;font-weight:700;color:${PRIMARY};">EasySlip HR</span>
        </td></tr>
        <tr><td style="background:${CARD};border:1px solid ${BORDER};border-radius:12px;padding:32px 28px;">
          <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:${TEXT};">รีเซ็ตรหัสผ่าน</p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:${MUTED};">
            เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีนี้ กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ ลิงก์จะหมดอายุใน <strong>1 ชั่วโมง</strong>
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="border-radius:8px;background:${PRIMARY};">
              <a href="${resetUrl}" target="_blank"
                style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;border-radius:8px;">
                รีเซ็ตรหัสผ่าน →
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:12px;color:${MUTED};">หรือคัดลอกลิงก์นี้ลงในเบราว์เซอร์:</p>
          <p style="margin:0 0 20px;font-size:11px;color:${MUTED};word-break:break-all;">
            <a href="${resetUrl}" style="color:${PRIMARY};">${resetUrl}</a>
          </p>
          <hr style="border:none;border-top:1px solid ${BORDER};margin:0 0 16px;" />
          <p style="margin:0;font-size:12px;color:${MUTED};">ถ้าคุณไม่ได้ขอรีเซ็ตรหัสผ่าน ไม่ต้องทำอะไร — รหัสผ่านปัจจุบันของคุณยังคงเดิม</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
