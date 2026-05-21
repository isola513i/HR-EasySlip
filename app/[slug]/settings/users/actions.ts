"use server";

import { revalidatePath } from "next/cache";
import { getTenantId } from "@/lib/db/tenant-context";
import { getTenantPrisma } from "@/lib/db/tenant";
import { getControlPlane } from "@/lib/db/control-plane";
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
    const [cp, prisma] = [getControlPlane(), await getTenantPrisma(tenantId)];

    const existingMembership = await cp.tenantMembership.findFirst({
      where: { tenantId, user: { email } },
    });
    if (existingMembership) return { error: "A user with this email already exists in this workspace" };

    const tempPassword = generateTempPassword();
    const [count, passwordHash] = await Promise.all([
      prisma.employee.count(),
      hashPassword(tempPassword),
    ]);
    const employeeCode = `USR${String(count + 1).padStart(4, "0")}`;

    // Upsert CP user (may already exist from another tenant)
    const cpUser = await cp.user.upsert({
      where: { email },
      create: { email, emailVerified: new Date(), passwordHash, mustChangePassword: true },
      update: {},
      select: { id: true },
    });

    // Create employee record in tenant DB (no nested user create)
    const employee = await prisma.employee.create({
      data: {
        userId: cpUser.id,
        firstNameTh,
        lastNameTh,
        employeeCode,
        hireDate: new Date(),
        roles: [role],
      },
      select: { id: true },
    });

    // Create TenantMembership in CP
    await cp.tenantMembership.create({
      data: {
        userId: cpUser.id,
        tenantId,
        role,
        employeeRecordId: employee.id,
        status: "ACTIVE",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: caller.userId,
        action: "settings.users.invite",
        entityType: "Employee",
        entityId: employee.id,
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
    const cp = getControlPlane();

    const membership = await cp.tenantMembership.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
      select: { status: true },
    });
    if (!membership) return { error: "User not found in this workspace" };

    const newStatus = membership.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    await cp.tenantMembership.update({
      where: { userId_tenantId: { userId, tenantId } },
      data: { status: newStatus },
    });

    const prisma = await getTenantPrisma(tenantId);
    await prisma.auditLog.create({
      data: {
        actorId: caller.userId,
        action: newStatus === "SUSPENDED" ? "settings.users.disable" : "settings.users.enable",
        entityType: "User",
        entityId: userId,
        after: { status: newStatus },
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
  const caller = await requireRoles(TENANT_ADMIN_ROLES);

  const employeeId = (formData.get("employeeId") as string | null)?.trim();
  const userId = (formData.get("userId") as string | null)?.trim();
  const role = (formData.get("role") as string | null)?.trim() as Role | undefined;
  if (!employeeId || !userId || !role) return { error: "Missing fields" };
  if (!VALID_INVITE_ROLES.includes(role)) return { error: "Invalid role" };

  try {
    const tenantId = await getTenantId();
    const [cp, prisma] = [getControlPlane(), await getTenantPrisma(tenantId)];

    await Promise.all([
      prisma.employee.update({ where: { id: employeeId }, data: { roles: [role] } }),
      cp.tenantMembership.update({
        where: { userId_tenantId: { userId, tenantId } },
        data: { role },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        actorId: caller.userId,
        action: "settings.users.change_role",
        entityType: "Employee",
        entityId: employeeId,
        after: { role },
      },
    });

    revalidatePath("/settings/users");
    return { success: true };
  } catch {
    return { error: "Failed to update role" };
  }
}
