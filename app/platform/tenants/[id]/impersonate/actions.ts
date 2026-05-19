"use server";

import { getControlPlane } from "@/lib/db/control-plane";
import { requirePlatformSession } from "@/lib/auth/platform";
import { PLATFORM_ADMIN_ROLES } from "@/lib/security/platform-rbac";
import { createImpersonationToken } from "@/lib/auth/impersonation";

type ActionResult = { error: string } | { redirectUrl: string } | null;

export async function startImpersonation(
  tenantId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  const reason = (formData.get("reason") as string | null)?.trim();
  if (!reason) return { error: "Reason is required." };

  const cp = getControlPlane();
  const tenant = await cp.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true, status: true },
  });
  if (!tenant) return { error: "Tenant not found." };
  if (tenant.status === "SUSPENDED" || tenant.status === "DELETED") {
    return { error: "Cannot impersonate a suspended or deleted tenant." };
  }

  const impersonation = await cp.impersonation.create({
    data: { platformUserId: session.userId, tenantId, reason },
  });

  await cp.platformAuditLog.create({
    data: {
      actorId: session.userId,
      tenantId,
      action: "impersonation.start",
      targetType: "Impersonation",
      targetId: impersonation.id,
      metadata: { reason, tenantSlug: tenant.slug },
    },
  });

  const expiresAt = Date.now() + 60 * 60 * 1_000;
  const token = await createImpersonationToken({
    impersonationId: impersonation.id,
    platformUserId: session.userId,
    platformEmail: session.email,
    tenantId,
    tenantSlug: tenant.slug,
    expiresAt,
  });

  const rootDomain = process.env.ROOT_DOMAIN ?? "localhost:3000";
  const isLocal = rootDomain.startsWith("localhost") || rootDomain.includes("lvh.me");
  const tenantBase = isLocal
    ? `http://${tenant.slug}.lvh.me:3000`
    : `https://${tenant.slug}.${rootDomain}`;

  // Pass the token in the URL so the tenant-side handoff route can set
  // the cookie directly for that subdomain, avoiding cross-origin cookie issues.
  return { redirectUrl: `${tenantBase}/impersonation/handoff?token=${token}` };
}
