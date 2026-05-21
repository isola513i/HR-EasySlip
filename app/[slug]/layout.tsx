import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveTenantBySlug } from "@/lib/db/tenant-resolver";
import { setRequestTenant } from "@/lib/db/tenant-context";
import { verifyImpersonationToken, IMPERSONATION_COOKIE } from "@/lib/auth/impersonation";
import { ImpersonationBanner } from "@/components/tenant/impersonation-banner";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await resolveTenantBySlug(slug);
  if (!tenant) notFound();

  setRequestTenant({ id: tenant.id, slug: tenant.slug });

  if (tenant.status === "SUSPENDED" || tenant.status === "DELETED") {
    redirect(`/${slug}/forbidden?reason=suspended`);
  }

  const [session, jar] = await Promise.all([auth(), cookies()]);
  if (session?.user?.id) {
    const membership = session.user.memberships?.find((m) => m.tenantId === tenant.id);
    if (!membership || membership.status !== "ACTIVE") {
      redirect("/workspaces?error=no_access");
    }
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
