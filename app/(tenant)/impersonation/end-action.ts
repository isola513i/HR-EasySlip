"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getControlPlane } from "@/lib/db/control-plane";
import { verifyImpersonationToken, IMPERSONATION_COOKIE } from "@/lib/auth/impersonation";

export async function endImpersonation(): Promise<void> {
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

  const platformUrl = isLocal
    ? `http://admin.lvh.me:3000/tenants`
    : `https://admin.${rootDomain}/tenants`;
  redirect(platformUrl);
}
