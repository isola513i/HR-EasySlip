"use server";

import { getTenantId } from "@/lib/db/tenant-context";
import { getTenantPrisma } from "@/lib/db/tenant";
import { requireRoles, TENANT_ADMIN_ROLES } from "@/lib/security/rbac";

type ActionResult = { success: true } | { error: string };

export async function saveCompanySettings(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const caller = await requireRoles(TENANT_ADMIN_ROLES);
  const userId = caller.userId;

  const companyName = (formData.get("companyName") as string | null)?.trim();
  const timezone = (formData.get("timezone") as string | null)?.trim();

  if (!companyName) return { error: "Company name is required" };
  if (!timezone) return { error: "Timezone is required" };

  try {
    const tenantId = await getTenantId();
    const prisma = await getTenantPrisma(tenantId);

    await Promise.all([
      prisma.systemConfig.upsert({
        where: { key: "tenant.companyName" },
        update: { value: companyName, updatedBy: userId },
        create: { key: "tenant.companyName", value: companyName, updatedBy: userId },
      }),
      prisma.systemConfig.upsert({
        where: { key: "tenant.timezone" },
        update: { value: timezone, updatedBy: userId },
        create: { key: "tenant.timezone", value: timezone, updatedBy: userId },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: "settings.company.save",
        entityType: "SystemConfig",
        entityId: "tenant.companyName",
        after: { companyName, timezone },
      },
    });

    return { success: true };
  } catch {
    return { error: "Failed to save settings" };
  }
}
