import { z } from "zod";
import { auth } from "@/lib/auth";
import { getControlPlane } from "@/lib/db/control-plane";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { parseBody } from "@/lib/api/validate";
import { apiOk, apiError } from "@/lib/api/response";
import { hashPassword, verifyPassword } from "@/lib/auth/password-utils";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

export const PUT = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const session = await auth();
  if (!session?.user?.id) {
    return apiError("UNAUTHENTICATED", "ต้องเข้าสู่ระบบก่อน", 401);
  }
  const userId = session.user.id;

  const { currentPassword, newPassword } = await parseBody(req, ChangePasswordSchema);
  const cp = getControlPlane();

  const user = await cp.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, mustChangePassword: true, email: true },
  });

  if (!user) return apiError("USER_NOT_FOUND", "ไม่พบบัญชีผู้ใช้", 404);

  // Skip currentPassword verification when either
  //   - mustChangePassword=true (admin forced a change; temp pw is being invalidated anyway), or
  //   - passwordHash is null (user has never set one)
  // The session itself (magic-link or temp-pw login) already proves identity.
  const skipCurrentCheck = user.mustChangePassword || !user.passwordHash;

  if (!skipCurrentCheck) {
    if (!currentPassword) {
      return apiError("MISSING_CURRENT_PASSWORD", "กรุณากรอกรหัสผ่านปัจจุบัน", 400);
    }
    const valid = await verifyPassword(currentPassword, user.passwordHash!);
    if (!valid) {
      return apiError("INVALID_PASSWORD", "รหัสผ่านปัจจุบันไม่ถูกต้อง", 401);
    }
  }

  const newHash = await hashPassword(newPassword);
  await cp.user.update({
    where: { id: userId },
    data: { passwordHash: newHash, mustChangePassword: false },
  });

  await cp.platformAuditLog.create({
    data: {
      actorId: userId,
      action: "user.change_password",
      targetType: "User",
      targetId: userId,
      metadata: {
        email: user.email,
        wasForced: skipCurrentCheck,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      },
    },
  }).catch(() => {});

  return apiOk({ ok: true });
});
