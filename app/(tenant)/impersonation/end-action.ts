"use server";

import { cookies } from "next/headers";
import { getControlPlane } from "@/lib/db/control-plane";
import { verifyImpersonationToken, IMPERSONATION_COOKIE } from "@/lib/auth/impersonation";
import { writePlatformAuditToTenant } from "@/lib/audit/platform-audit";

export async function endImpersonation(): Promise<{ redirectUrl: string }> {
  const jar = await cookies();
  const token = jar.get(IMPERSONATION_COOKIE)?.value;

  if (token) {
    const session = await verifyImpersonationToken(token);
    if (session) {
      try {
        const cp = getControlPlane();
        await cp.impersonation.update({
          where: { id: session.impersonationId },
          data: { endedAt: new Date() },
        });
        await cp.platformAuditLog.create({
          data: {
            actorId: session.platformUserId,
            tenantId: session.tenantId,
            action: "impersonation.end",
            targetType: "Impersonation",
            targetId: session.impersonationId,
          },
        });
        // Tenant-side audit: visible to tenant admins
        writePlatformAuditToTenant({
          tenantId: session.tenantId,
          impersonationId: session.impersonationId,
          platformActorId: session.platformUserId,
          platformActorEmail: session.platformEmail,
          action: "platform_support.session_end",
          entityType: "Impersonation",
          entityId: session.impersonationId,
        }).catch(() => {}); // best-effort
      } catch {
        // best-effort — still clear the cookie
      }
    }
  }

  const rootDomain = process.env.ROOT_DOMAIN ?? "localhost:3000";
  const isLocal = rootDomain.startsWith("localhost") || rootDomain.includes("lvh.me");

  jar.delete({
    name: IMPERSONATION_COOKIE,
    path: "/",
    ...(isLocal ? {} : { domain: `.${rootDomain}` }),
  });

  // Cross-subdomain redirect: return URL so client can window.location.href.
  // redirect() from Server Actions goes through Next's client router which
  // can't traverse subdomain rewrites.
  const redirectUrl = isLocal
    ? `http://admin.lvh.me:3000/tenants`
    : `https://admin.${rootDomain}/tenants`;
  return { redirectUrl };
}
