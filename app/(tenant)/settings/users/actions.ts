"use server";

import { revalidatePath } from "next/cache";
import { getTenantId } from "@/lib/db/tenant-context";
import { getTenantPrisma } from "@/lib/db/tenant";
import { requireRoles, TENANT_ADMIN_ROLES } from "@/lib/security/rbac";
import { generateTempPassword, hashPassword } from "@/lib/auth/password-utils";
import type { Role } from "@prisma/client";

const VALID_INVITE_ROLES: readonly Role[] = [
  "EMPLOYEE", "MANAGER", "TENANT_ADMIN", "HR_AUTHORIZED", "HRMG",
] as const;

type InviteResult = { success: true; tempPassword: string } | { error: string };
type ActionResult = { success: true } | { error: string };

export async function inviteUser(
  _prev: InviteResult | null,
  formData: FormData,
): Promise<InviteResult> {
  const caller = await requireRoles(TENANT_ADMIN_ROLES);

  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const firstNameTh = (formData.get("firstNameTh") as string | null)?.trim();
  const lastNameTh = (formData.get("lastNameTh") as string | null)?.trim();
  const role = (formData.get("role") as string | null)?.trim() as Role | undefined;

  if (!email || !firstNameTh || !lastNameTh || !role) {
    return { error: "All fields are required" };
  }
  if (!VALID_INVITE_ROLES.includes(role)) {
    return { error: "Invalid role" };
  }

  try {
    const tenantId = await getTenantId();
    const prisma = await getTenantPrisma(tenantId);

    const [existing, count] = await Promise.all([
      prisma.user.findUnique({ where: { email }, select: { id: true } }),
      prisma.employee.count(),
    ]);
    if (existing) return { error: "A user with this email already exists" };

    const employeeCode = `USR${String(count + 1).padStart(4, "0")}`;
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        mustChangePassword: true,
        employee: {
          create: { firstNameTh, lastNameTh, employeeCode, hireDate: new Date(), roles: [role] },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: caller.userId,
        action: "settings.users.invite",
        entityType: "User",
        entityId: newUser.id,
        after: { email, firstNameTh, lastNameTh, role, employeeCode },
      },
    });

    revalidatePath("/settings/users");
    return { success: true, tempPassword };
  } catch {
    return { error: "Failed to create user" };
  }
}

export async function toggleUserStatus(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const caller = await requireRoles(TENANT_ADMIN_ROLES);

  const userId = (formData.get("userId") as string | null)?.trim();
  if (!userId) return { error: "Missing user ID" };
  if (userId === caller.userId) return { error: "You cannot disable your own account" };

  try {
    const tenantId = await getTenantId();
    const prisma = await getTenantPrisma(tenantId);

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { isDisabled: true } });
    if (!user) return { error: "User not found" };

    await prisma.user.update({ where: { id: userId }, data: { isDisabled: !user.isDisabled } });

    await prisma.auditLog.create({
      data: {
        actorId: caller.userId,
        action: user.isDisabled ? "settings.users.enable" : "settings.users.disable",
        entityType: "User",
        entityId: userId,
        after: { isDisabled: !user.isDisabled },
      },
    });

    revalidatePath("/settings/users");
    return { success: true };
  } catch {
    return { error: "Failed to update user status" };
  }
}

export async function changeUserRole(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireRoles(TENANT_ADMIN_ROLES);

  const employeeId = (formData.get("employeeId") as string | null)?.trim();
  const role = (formData.get("role") as string | null)?.trim() as Role | undefined;
  if (!employeeId || !role) return { error: "Missing fields" };
  if (!VALID_INVITE_ROLES.includes(role)) return { error: "Invalid role" };

  try {
    const tenantId = await getTenantId();
    const prisma = await getTenantPrisma(tenantId);
    await prisma.employee.update({ where: { id: employeeId }, data: { roles: [role] } });
    revalidatePath("/settings/users");
    return { success: true };
  } catch {
    return { error: "Failed to update role" };
  }
}
