import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { parseBody } from "@/lib/api/validate";
import { apiOk } from "@/lib/api/response";
import { sendNotificationEmail } from "@/lib/email/notification-service";
import { authEndpointLimiter } from "@/lib/security/rate-limit";

const ForgotPasswordSchema = z.object({ email: z.string().email() });

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export const POST = withApiHandler(async (req, _ctx) => {
  const { email } = await parseBody(req, ForgotPasswordSchema);
  const emailLower = email.toLowerCase();

  // Always return success to not reveal if email exists
  const successResponse = apiOk({ message: "ถ้ามีบัญชีอยู่ในระบบ จะได้รับอีเมลสำหรับรีเซ็ตรหัสผ่าน" });

  const user = await prisma.user.findUnique({ where: { email: emailLower } });
  if (!user) return successResponse;

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + TOKEN_EXPIRY_MS);

  // Atomic replace: delete existing + create new in a single transaction
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: `reset:${emailLower}` } }),
    prisma.verificationToken.create({
      data: { identifier: `reset:${emailLower}`, token, expires },
    }),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/signin/reset-password?token=${token}&email=${encodeURIComponent(emailLower)}`;

  const sent = await sendNotificationEmail(
    emailLower,
    "รีเซ็ตรหัสผ่าน EasySlip HR",
    `<p>กดลิงก์ด้านล่างเพื่อรีเซ็ตรหัสผ่าน (หมดอายุใน 1 ชั่วโมง):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    `รีเซ็ตรหัสผ่าน: ${resetUrl}`,
  );

  if (!sent) {
    console.log(`[forgot-password] Email delivery failed. Reset URL: /signin/reset-password?token=${token}&email=${encodeURIComponent(emailLower)}`);
  }

  return successResponse;
}, { rateLimit: authEndpointLimiter });
