import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { verifyImpersonationToken, IMPERSONATION_COOKIE } from "@/lib/auth/impersonation";
import { ImpersonationBanner } from "@/components/tenant/impersonation-banner";

/**
 * Tenant zone layout.
 *
 * Checks:
 * 1. Middleware injected x-tenant-id (tenant resolved by slug)
 * 2. Authenticated user has ACTIVE TenantMembership here (cross-tenant URL tampering guard)
 *
 * Unauthenticated users on protected paths are already caught by middleware.
 * This layout adds the extra check for authenticated users visiting tenants
 * they don't belong to.
 */
export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  if (!h.get("x-tenant-id")) {
    notFound();
  }

  // Cross-tenant URL tampering guard: authenticated users must have membership here
  const [session, jar] = await Promise.all([auth(), cookies()]);
  if (session?.user?.id) {
    const tenantId = h.get("x-tenant-id")!;
    const membership = session.user.memberships?.find(
      (m) => m.tenantId === tenantId,
    );
    if (!membership || membership.status !== "ACTIVE") {
      redirect("/workspaces?error=no_access");
    }
    // mustChangePassword is handled per-page (requireRoles / dashboard) to avoid
    // redirect loops when the user is already on the change-password page
  }

  const token = jar.get(IMPERSONATION_COOKIE)?.value;
  const impersonation = token ? await verifyImpersonationToken(token) : null;

  return (
    <>
      {impersonation && (
        <ImpersonationBanner
          platformEmail={impersonation.platformEmail}
          expiresAt={impersonation.expiresAt}
        />
      )}
      {children}
    </>
  );
}
