import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { requireApiRoles, TENANT_ADMIN_ROLES } from "@/lib/security/rbac";
import { writeAuditLog } from "@/lib/audit/logger";
import { generateTenantExport } from "@/lib/tenant-export/tenant-exporter";
import { getControlPlane } from "@/lib/db/control-plane";
import { getTenantId } from "@/lib/db/tenant-context";

export const GET = withApiHandler(async () => {
  const caller = await requireApiRoles(TENANT_ADMIN_ROLES);
  if (caller instanceof NextResponse) return caller;

  const tenantId = await getTenantId();
  const data = await generateTenantExport();
  const json = JSON.stringify(data, null, 2);
  const date = new Date().toISOString().split("T")[0];

  // Record export timestamp on tenant (best-effort, don't fail the download)
  const cp = getControlPlane();
  cp.tenant.update({
    where: { id: tenantId },
    data: { lastExportRequestedAt: new Date() },
  }).catch(() => {});

  await writeAuditLog({
    actorId: caller.userId,
    action: "export.full_data",
    entityType: "Tenant",
    entityId: tenantId,
    after: { exportedAt: new Date().toISOString() },
  });

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="easyslip-export-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
});
