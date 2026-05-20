"use server";

import { requireRoles, TENANT_ADMIN_ROLES } from "@/lib/security/rbac";
import { getTenantId } from "@/lib/db/tenant-context";
import { getControlPlane } from "@/lib/db/control-plane";

export interface TenantLifecycleStatus {
  status: string;
  expiredAt: string | null;
  gracePeriodEndsAt: string | null;
  softDeleteAt: string | null;
  hardDeleteAt: string | null;
  softDeletedAt: string | null;
  lastExportRequestedAt: string | null;
}

export async function getTenantLifecycleStatus(): Promise<TenantLifecycleStatus> {
  await requireRoles(TENANT_ADMIN_ROLES);
  const tenantId = await getTenantId();
  const cp = getControlPlane();

  const tenant = await cp.tenant.findUnique({
    where: { id: tenantId },
    select: {
      status: true,
      expiredAt: true,
      gracePeriodEndsAt: true,
      softDeleteAt: true,
      hardDeleteAt: true,
      softDeletedAt: true,
      lastExportRequestedAt: true,
    },
  });

  const t = tenant ?? {
    status: "ACTIVE",
    expiredAt: null, gracePeriodEndsAt: null, softDeleteAt: null,
    hardDeleteAt: null, softDeletedAt: null, lastExportRequestedAt: null,
  };

  return {
    status: t.status,
    expiredAt: t.expiredAt?.toISOString() ?? null,
    gracePeriodEndsAt: t.gracePeriodEndsAt?.toISOString() ?? null,
    softDeleteAt: t.softDeleteAt?.toISOString() ?? null,
    hardDeleteAt: t.hardDeleteAt?.toISOString() ?? null,
    softDeletedAt: t.softDeletedAt?.toISOString() ?? null,
    lastExportRequestedAt: t.lastExportRequestedAt?.toISOString() ?? null,
  };
}
