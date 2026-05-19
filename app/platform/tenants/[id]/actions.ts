"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getControlPlane } from "@/lib/db/control-plane";
import { requirePlatformSession } from "@/lib/auth/platform";
import { PLATFORM_ADMIN_ROLES } from "@/lib/security/platform-rbac";
import { ALLOWED_TRANSITIONS } from "@/lib/security/tenant-transitions";
import { getPlanByCode } from "@/lib/platform/plan-catalog";

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

  revalidatePath(`/tenants/${tenantId}`);
  revalidatePath("/tenants");
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

  revalidatePath(`/tenants/${tenantId}`);
  revalidatePath("/tenants");
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

  if (tenant.status !== "SUSPENDED") return { error: "Tenant is not suspended." };

  await cp.tenant.update({ where: { id: tenantId }, data: { status: "ACTIVE" } });
  await cp.platformAuditLog.create({
    data: {
      actorId: session.userId,
      tenantId,
      action: "tenant.reactivate",
      metadata: { reason },
    },
  });

  revalidatePath(`/tenants/${tenantId}`);
  revalidatePath("/tenants");
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

  revalidatePath(`/tenants/${tenantId}`);
  revalidatePath("/plans");
  return null;
}
