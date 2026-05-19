"use server";

import { redirect } from "next/navigation";
import { getControlPlane } from "@/lib/db/control-plane";
import { requirePlatformSession } from "@/lib/auth/platform";
import { PLATFORM_ADMIN_ROLES } from "@/lib/security/platform-rbac";
import { encryptUrl } from "@/lib/db/url-encryption";
import { provisionTenantDb } from "@/lib/tenant/provision";

const CREATABLE_STATUSES = ["ACTIVE", "TRIAL", "PENDING"] as const;

type ActionResult = { error: string } | null;

export async function createTenant(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);

  const slug = (formData.get("slug") as string).trim().toLowerCase();
  const companyName = (formData.get("companyName") as string).trim();
  const contactEmail = (formData.get("contactEmail") as string).trim();
  const contactName = (formData.get("contactName") as string).trim();
  const databaseUrl = (formData.get("databaseUrl") as string).trim();
  const directUrl = (formData.get("directUrl") as string | null)?.trim() || null;
  const status = ((formData.get("status") as string) || "ACTIVE") as (typeof CREATABLE_STATUSES)[number];

  if (!slug || !companyName || !contactEmail || !databaseUrl) {
    return { error: "slug, companyName, contactEmail, and databaseUrl are required." };
  }
  if (!CREATABLE_STATUSES.includes(status)) {
    return { error: `Invalid status. Allowed: ${CREATABLE_STATUSES.join(", ")}.` };
  }

  const cp = getControlPlane();
  const slugTaken = await cp.tenant.findUnique({ where: { slug }, select: { id: true } });
  if (slugTaken) return { error: `Slug "${slug}" is already taken.` };

  // Create the CP record first so the tenant is tracked even if provision fails.
  const databaseUrlEnc = encryptUrl(databaseUrl);
  const directUrlEnc = directUrl ? encryptUrl(directUrl) : null;
  const now = new Date();

  const tenant = await cp.tenant.create({
    data: { slug, companyName, status: "PENDING", databaseUrlEnc, directUrlEnc, provisionedAt: now },
  });

  const provision = await provisionTenantDb({ databaseUrl, directUrl, companyName, adminEmail: contactEmail, adminName: contactName });
  if (!provision.success) {
    await cp.tenant.delete({ where: { id: tenant.id } });
    return { error: provision.error ?? "Provisioning failed." };
  }

  await Promise.all([
    cp.tenant.update({ where: { id: tenant.id }, data: { status } }),
    cp.platformAuditLog.create({
      data: {
        actorId: session.userId,
        tenantId: tenant.id,
        action: "tenant.create_manual",
        metadata: { slug, companyName, status },
      },
    }),
  ]);

  redirect(`/tenants/${tenant.id}`);
}
