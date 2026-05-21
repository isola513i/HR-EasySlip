import { z } from "zod";
import { getControlPlane } from "@/lib/db/control-plane";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { parseBody } from "@/lib/api/validate";
import { apiOk, apiError } from "@/lib/api/response";
import { hashPassword } from "@/lib/auth/password-utils";
import { writeAuditLog } from "@/lib/audit/logger";
import { authEndpointLimiter } from "@/lib/security/rate-limit";

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  newPassword: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

export const POST = withApiHandler(async (req, ctx) => {
  const { token, email, newPassword } = await parseBody(req, ResetPasswordSchema);
  const emailLower = email.toLowerCase();
  const cp = getControlPlane();

  // Parallel: fetch token + user at the same time
  const [record, user] = await Promise.all([
    cp.verificationToken.findFirst({
      where: { identifier: `reset:${emailLower}`, token },
    }),
    cp.user.findUnique({ where: { email: emailLower } }),
  ]);

  if (!record || record.expires < new Date() || !user) {
    return apiError("INVALID_TOKEN", "ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณาขอใหม่อีกครั้ง", 400);
  }

  const passwordHash = await hashPassword(newPassword);

  // Update password and delete token in CP transaction; audit log goes to tenant DB separately
  await cp.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    });
    await tx.verificationToken.deleteMany({
      where: { identifier: `reset:${emailLower}` },
    });
  });

  await writeAuditLog({
    actorId: user.id,
    action: "user.reset_password_self",
    entityType: "User",
    entityId: user.id,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return apiOk({ ok: true });
}, { rateLimit: authEndpointLimiter });
