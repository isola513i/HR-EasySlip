"use server";

import { requireRoles, TENANT_ADMIN_ROLES } from "@/lib/security/rbac";
import { getTenantId } from "@/lib/db/tenant-context";
import { getTenantPrisma } from "@/lib/db/tenant";
import { getControlPlane } from "@/lib/db/control-plane";

type ActionResult = { success: true } | { error: string };

export async function setImpersonationEnabled(enabled: boolean): Promise<ActionResult> {
  const caller = await requireRoles(TENANT_ADMIN_ROLES);

  try {
    const tenantId = await getTenantId();
    const cp = getControlPlane();

    const tenant = await cp.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, impersonationEnabled: true },
    });
    if (!tenant) return { error: "Tenant not found" };

    if (tenant.impersonationEnabled === enabled) return { success: true };

    // When disabling: force-end active sessions + cancel pending requests
    if (!enabled) {
      const now = new Date();
      await cp.$transaction([
        cp.impersonation.updateMany({
          where: { tenantId, endedAt: null },
          data: { endedAt: now },
        }),
        cp.impersonationRequest.updateMany({
          where: { tenantId, status: "PENDING" },
          data: { status: "CANCELLED", decidedAt: now, decisionNote: "Tenant disabled platform support access" },
        }),
      ]);
    }

    await cp.tenant.update({
      where: { id: tenantId },
      data: {
        impersonationEnabled: enabled,
        impersonationDisabledAt: enabled ? null : new Date(),
        impersonationDisabledBy: enabled ? null : caller.userId,
        impersonationDisabledByEmail: enabled ? null : (caller.email ?? null),
      },
    });

    // Tenant-side audit log
    const prisma = await getTenantPrisma(tenantId);
    await prisma.auditLog.create({
      data: {
        actorId: caller.userId,
        action: enabled ? "settings.impersonation.enabled" : "settings.impersonation.disabled",
        entityType: "Tenant",
        entityId: tenantId,
        after: { impersonationEnabled: enabled },
      },
    });

    return { success: true };
  } catch {
    return { error: "Failed to update setting" };
  }
}

export async function getImpersonationStatus(): Promise<{
  enabled: boolean;
  disabledAt: Date | null;
  disabledByEmail: string | null;
}> {
  await requireRoles(TENANT_ADMIN_ROLES);

  const tenantId = await getTenantId();
  const cp = getControlPlane();

  const tenant = await cp.tenant.findUnique({
    where: { id: tenantId },
    select: {
      impersonationEnabled: true,
      impersonationDisabledAt: true,
      impersonationDisabledByEmail: true,
    },
  });

  return {
    enabled: tenant?.impersonationEnabled ?? true,
    disabledAt: tenant?.impersonationDisabledAt ?? null,
    disabledByEmail: tenant?.impersonationDisabledByEmail ?? null,
  };
}
