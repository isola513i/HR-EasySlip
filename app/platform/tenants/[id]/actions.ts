"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getControlPlane } from "@/lib/db/control-plane";
import { requirePlatformSession } from "@/lib/auth/platform";
import { PLATFORM_ADMIN_ROLES } from "@/lib/security/platform-rbac";
import { ALLOWED_TRANSITIONS } from "@/lib/security/tenant-transitions";
import { getPlanByCode } from "@/lib/platform/plan-catalog";
import { buildLifecycleDates, clearLifecycleDates } from "@/lib/platform/tenant-lifecycle-service";
import { deleteBranch, NeonError } from "@/lib/neon/client";
import { hashPassword, generateTempPassword } from "@/lib/auth/password-utils";

const FLASH_TEMP_PASSWORD_COOKIE = "es_platform_temp_password";

export async function dismissTempPassword(): Promise<void> {
  await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  const c = await cookies();
  c.delete(FLASH_TEMP_PASSWORD_COOKIE);
}

type ActionResult = { error: string } | null;

export async function updateTenantStatus(
  tenantId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  const newStatus = formData.get("status") as string;

  const cp = getControlPlane();
  const tenant = await cp.tenant.findUnique({ where: { id: tenantId }, select: { status: true } });
  if (!tenant) return { error: "Tenant not found." };

  const allowed = ALLOWED_TRANSITIONS[tenant.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return { error: `Cannot transition from ${tenant.status} to ${newStatus}.` };
  }

  await cp.tenant.update({ where: { id: tenantId }, data: { status: newStatus } });
  await cp.platformAuditLog.create({
    data: {
      actorId: session.userId,
      tenantId,
      action: "tenant.status_change",
      metadata: { from: tenant.status, to: newStatus },
    },
  });

  revalidatePath(`/platform/tenants/${tenantId}`);
  revalidatePath("/platform/tenants");
  return null;
}

export async function suspendTenant(
  tenantId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  const reason = (formData.get("reason") as string)?.trim();
  if (!reason) return { error: "Reason is required." };

  const cp = getControlPlane();
  const tenant = await cp.tenant.findUnique({ where: { id: tenantId }, select: { status: true } });
  if (!tenant) return { error: "Tenant not found." };

  const allowed = ALLOWED_TRANSITIONS[tenant.status] ?? [];
  if (!allowed.includes("SUSPENDED")) return { error: "Cannot suspend this tenant." };

  await cp.tenant.update({ where: { id: tenantId }, data: { status: "SUSPENDED" } });
  await cp.platformAuditLog.create({
    data: {
      actorId: session.userId,
      tenantId,
      action: "tenant.suspend",
      metadata: { from: tenant.status, reason },
    },
  });

  revalidatePath(`/platform/tenants/${tenantId}`);
  revalidatePath("/platform/tenants");
  return null;
}

export async function reactivateTenant(
  tenantId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  const reason = (formData.get("reason") as string)?.trim();
  if (!reason) return { error: "Reason is required." };

  const cp = getControlPlane();
  const tenant = await cp.tenant.findUnique({ where: { id: tenantId }, select: { status: true } });
  if (!tenant) return { error: "Tenant not found." };

  if (!["SUSPENDED", "EXPIRED"].includes(tenant.status)) {
    return { error: "Tenant is not suspended or expired." };
  }

  await cp.tenant.update({
    where: { id: tenantId },
    data: { status: "ACTIVE", ...clearLifecycleDates() },
  });
  await cp.platformAuditLog.create({
    data: {
      actorId: session.userId,
      tenantId,
      action: "tenant.reactivate",
      metadata: { from: tenant.status, reason },
    },
  });

  revalidatePath(`/platform/tenants/${tenantId}`);
  revalidatePath("/platform/tenants");
  return null;
}

export async function expireTenant(
  tenantId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  const reason = (formData.get("reason") as string)?.trim();
  if (!reason) return { error: "Reason is required." };

  const cp = getControlPlane();
  const tenant = await cp.tenant.findUnique({ where: { id: tenantId }, select: { status: true } });
  if (!tenant) return { error: "Tenant not found." };

  const allowed = ALLOWED_TRANSITIONS[tenant.status] ?? [];
  if (!allowed.includes("EXPIRED")) return { error: "Cannot expire this tenant." };

  const lifecycle = buildLifecycleDates(new Date());

  await cp.tenant.update({
    where: { id: tenantId },
    data: { status: "EXPIRED", ...lifecycle },
  });
  await cp.platformAuditLog.create({
    data: {
      actorId: session.userId,
      tenantId,
      action: "tenant.expire",
      metadata: {
        from: tenant.status,
        reason,
        gracePeriodEndsAt: lifecycle.gracePeriodEndsAt,
        hardDeleteAt: lifecycle.hardDeleteAt,
      },
    },
  });

  revalidatePath(`/platform/tenants/${tenantId}`);
  revalidatePath("/platform/tenants");
  return null;
}

export async function updateTenantPlan(
  tenantId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  const planCode = (formData.get("planCode") as string)?.trim() || null;

  if (planCode && !(await getPlanByCode(planCode))) {
    return { error: "Invalid plan code." };
  }

  const cp = getControlPlane();
  const tenant = await cp.tenant.findUnique({ where: { id: tenantId }, select: { planCode: true } });
  if (!tenant) return { error: "Tenant not found." };

  await cp.tenant.update({ where: { id: tenantId }, data: { planCode } });
  await cp.platformAuditLog.create({
    data: {
      actorId: session.userId,
      tenantId,
      action: "tenant.plan_change",
      metadata: { from: tenant.planCode, to: planCode },
    },
  });

  revalidatePath(`/platform/tenants/${tenantId}`);
  revalidatePath("/platform/plans");
  return null;
}

type DeleteResult = { ok: true } | { ok: false; error: string };

export async function deleteTenant(
  tenantId: string,
  confirmedSlug: string,
): Promise<DeleteResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  const trimmed = confirmedSlug.trim();

  const cp = getControlPlane();
  const tenant = await cp.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true, companyName: true, neonBranchId: true },
  });
  if (!tenant) return { ok: false, error: "Tenant not found." };
  if (trimmed !== tenant.slug) return { ok: false, error: `Slug mismatch. Type "${tenant.slug}" to confirm.` };

  await cp.platformAuditLog.create({
    data: {
      actorId: session.userId,
      tenantId,
      action: "tenant.hard_delete",
      metadata: { slug: tenant.slug, companyName: tenant.companyName },
    },
  });

  await cp.tenant.delete({ where: { id: tenantId } });

  // Nullify the tenantId reference in associated TrialSignup records so they
  // don't appear as "live" after the tenant is gone.
  await cp.trialSignup.updateMany({
    where: { tenantId },
    data: { tenantId: null },
  });

  if (tenant.neonBranchId) {
    deleteBranch(tenant.neonBranchId).catch((e) => {
      if (!(e instanceof NeonError)) console.error("[delete-tenant] branch cleanup failed:", e);
    });
  }

  revalidatePath("/platform/tenants");
  return { ok: true };
}

export async function resetTenantAdminPassword(
  tenantId: string,
  confirmedSlug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  const trimmed = confirmedSlug.trim();

  const cp = getControlPlane();
  const tenant = await cp.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true, companyName: true },
  });
  if (!tenant) return { ok: false, error: "Tenant not found." };
  if (trimmed !== tenant.slug) return { ok: false, error: `Slug mismatch. Type "${tenant.slug}" to confirm.` };

  const adminMembership = await cp.tenantMembership.findFirst({
    where: { tenantId, role: "TENANT_ADMIN", status: "ACTIVE" },
    select: { user: { select: { id: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (!adminMembership?.user) {
    return { ok: false, error: "No active TENANT_ADMIN found for this tenant." };
  }

  const tempPassword = generateTempPassword(12);
  const passwordHash = await hashPassword(tempPassword);

  await cp.user.update({
    where: { id: adminMembership.user.id },
    data: { passwordHash, mustChangePassword: true },
  });

  await cp.platformAuditLog.create({
    data: {
      actorId: session.userId,
      tenantId,
      action: "tenant.reset_admin_password",
      targetType: "User",
      targetId: adminMembership.user.id,
      metadata: { adminEmail: adminMembership.user.email },
    },
  });

  const c = await cookies();
  c.set(FLASH_TEMP_PASSWORD_COOKIE, JSON.stringify({
    tenantId,
    email: adminMembership.user.email,
    password: tempPassword,
  }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/platform",
  });

  revalidatePath(`/platform/tenants/${tenantId}`);
  return { ok: true };
}
