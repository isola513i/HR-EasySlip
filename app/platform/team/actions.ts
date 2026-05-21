"use server";

import { revalidatePath } from "next/cache";
import { getControlPlane } from "@/lib/db/control-plane";
import { requirePlatformSession } from "@/lib/auth/platform";
import { PLATFORM_ADMIN_ROLES } from "@/lib/security/platform-rbac";
import { hashPassword, generateTempPassword } from "@/lib/auth/password-utils";
import type { PlatformRole } from "@/lib/db/generated/control-plane";

type ActionResult = { error: string } | null;
type CreateResult = { error: string } | { tempPassword: string } | null;

const VALID_ROLES: PlatformRole[] = ["SUPER_ADMIN", "SUPPORT", "BILLING"];

export async function createPlatformUser(
  _prev: CreateResult,
  formData: FormData
): Promise<CreateResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = formData.get("role") as PlatformRole;

  if (!email || !email.includes("@")) return { error: "Valid email is required." };
  if (!VALID_ROLES.includes(role)) return { error: "Invalid role." };

  const cp = getControlPlane();
  const existing = await cp.platformUser.findUnique({ where: { email } });
  if (existing) return { error: "A user with this email already exists." };

  const tempPassword = generateTempPassword(14);
  const passwordHash = await hashPassword(tempPassword);

  await cp.platformUser.create({ data: { email, role, passwordHash } });
  await cp.platformAuditLog.create({
    data: {
      actorId: session.userId,
      action: "platform_user.create",
      metadata: { email, role },
    },
  });

  revalidatePath("/platform/team");
  return { tempPassword };
}

export async function changePlatformUserRole(
  userId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  if (userId === session.userId) return { error: "You cannot change your own role." };

  const role = formData.get("role") as PlatformRole;
  if (!VALID_ROLES.includes(role)) return { error: "Invalid role." };

  const cp = getControlPlane();
  await cp.platformUser.update({ where: { id: userId }, data: { role } });
  await cp.platformAuditLog.create({
    data: {
      actorId: session.userId,
      action: "platform_user.role_change",
      targetType: "PlatformUser",
      targetId: userId,
      metadata: { role },
    },
  });

  revalidatePath("/platform/team");
  return null;
}

export async function removePlatformUser(
  userId: string,
  _prev: ActionResult,
  _formData: FormData
): Promise<ActionResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  if (userId === session.userId) return { error: "You cannot remove your own account." };

  const cp = getControlPlane();
  const user = await cp.platformUser.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) return { error: "User not found." };

  await cp.platformUser.delete({ where: { id: userId } });
  await cp.platformAuditLog.create({
    data: {
      actorId: session.userId,
      action: "platform_user.remove",
      targetType: "PlatformUser",
      targetId: userId,
      metadata: { email: user.email },
    },
  });

  revalidatePath("/platform/team");
  return null;
}

export async function togglePlatformUserDisabled(
  userId: string,
  _prev: ActionResult,
  _formData: FormData
): Promise<ActionResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  if (userId === session.userId) return { error: "You cannot disable your own account." };

  const cp = getControlPlane();
  const user = await cp.platformUser.findUnique({ where: { id: userId }, select: { isDisabled: true } });
  if (!user) return { error: "User not found." };

  await cp.platformUser.update({ where: { id: userId }, data: { isDisabled: !user.isDisabled } });
  await cp.platformAuditLog.create({
    data: {
      actorId: session.userId,
      action: "platform_user.toggle",
      targetType: "PlatformUser",
      targetId: userId,
      metadata: { disabled: !user.isDisabled },
    },
  });

  revalidatePath("/platform/team");
  return null;
}
