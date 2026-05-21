"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getControlPlane } from "@/lib/db/control-plane";
import { requirePlatformSession } from "@/lib/auth/platform";
import { PLATFORM_ADMIN_ROLES } from "@/lib/security/platform-rbac";
import { ALLOWED_TRANSITIONS } from "@/lib/security/tenant-transitions";
import { getPlanByCode } from "@/lib/platform/plan-catalog";
import { buildLifecycleDates, clearLifecycleDates } from "@/lib/platform/tenant-lifecycle-service";
import { deleteBranch, NeonError } from "@/lib/neon/client";

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

export async function deleteTenant(
  tenantId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  const confirmedSlug = (formData.get("confirmSlug") as string)?.trim();

  const cp = getControlPlane();
  const tenant = await cp.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true, companyName: true, neonBranchId: true },
  });
  if (!tenant) return { error: "Tenant not found." };
  if (confirmedSlug !== tenant.slug) return { error: `Slug mismatch. Type "${tenant.slug}" to confirm.` };

  await cp.platformAuditLog.create({
    data: {
      actorId: session.userId,
      tenantId,
      action: "tenant.hard_delete",
      metadata: { slug: tenant.slug, companyName: tenant.companyName },
    },
  });

  await cp.tenant.delete({ where: { id: tenantId } });

  if (tenant.neonBranchId) {
    deleteBranch(tenant.neonBranchId).catch((e) => {
      if (!(e instanceof NeonError)) console.error("[delete-tenant] branch cleanup failed:", e);
    });
  }

  redirect("/platform/tenants");
}
