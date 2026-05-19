import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyImpersonationToken, IMPERSONATION_COOKIE } from "@/lib/auth/impersonation";
import { ImpersonationBanner } from "@/components/tenant/impersonation-banner";

/**
 * Tenant zone layout.
 *
 * Validates that the middleware injected an `x-tenant-id` header.
 * If missing → redirect to /.
 * Reads impersonation cookie to show the SuperAdmin observer banner.
 */
export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  if (!h.get("x-tenant-id")) {
    redirect("/");
  }

  const jar = await cookies();
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
