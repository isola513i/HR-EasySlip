"use server";

import { redirect } from "next/navigation";
import { getControlPlane } from "@/lib/db/control-plane";
import { requirePlatformSession } from "@/lib/auth/platform";
import { encryptUrl } from "@/lib/db/url-encryption";
import { provisionTenantDb } from "@/lib/tenant/provision";
import { PLATFORM_ADMIN_ROLES } from "@/lib/security/platform-rbac";

type ActionResult = { error: string } | null;

export async function provisionTenant(
  tenantId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  const cp = getControlPlane();

  const databaseUrl = (formData.get("databaseUrl") as string).trim();
  const directUrl = (formData.get("directUrl") as string | null)?.trim() || null;
  const contactEmail = (formData.get("contactEmail") as string).trim();
  const contactName = (formData.get("contactName") as string).trim();

  if (!databaseUrl || !contactEmail || !contactName) {
    return { error: "DATABASE_URL, contact email, and contact name are required." };
  }

  const tenant = await cp.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true, companyName: true, status: true, databaseUrlEnc: true },
  });
  if (!tenant) return { error: "Tenant not found." };
  if (tenant.databaseUrlEnc) return { error: "Tenant already has a database configured." };

  const databaseUrlEnc = encryptUrl(databaseUrl);
  const directUrlEnc = directUrl ? encryptUrl(directUrl) : null;
  const now = new Date();

  await cp.tenant.update({
    where: { id: tenantId },
    data: { databaseUrlEnc, directUrlEnc, provisionedAt: now },
  });

  const provision = await provisionTenantDb({
    databaseUrl,
    directUrl,
    companyName: tenant.companyName,
    adminEmail: contactEmail,
    adminName: contactName,
  });

  if (!provision.success) {
    await cp.tenant.update({
      where: { id: tenantId },
      data: { databaseUrlEnc: null, directUrlEnc: null, provisionedAt: null },
    });
    return { error: provision.error ?? "Provisioning failed. Check DB credentials and retry." };
  }

  await Promise.all([
    cp.tenant.update({
      where: { id: tenantId },
      data: { status: tenant.status === "PENDING" ? "ACTIVE" : tenant.status },
    }),
    cp.platformAuditLog.create({
      data: {
        actorId: session.userId,
        tenantId,
        action: "tenant.provision",
        metadata: { slug: tenant.slug, companyName: tenant.companyName },
      },
    }),
  ]);

  redirect(`/platform/tenants/${tenantId}`);
}
