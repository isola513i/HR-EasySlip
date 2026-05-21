import { requireRoles, MANAGER_ROLES } from "@/lib/security/rbac";
import { requireConsent } from "@/lib/consent/require-consent";

export default async function ApprovalsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireRoles(MANAGER_ROLES, slug);
  await requireConsent(`/${slug}/employee/approvals`, slug);

  return <>{children}</>;
}
