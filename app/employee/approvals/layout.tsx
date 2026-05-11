import { requireRoles, MANAGER_ROLES } from "@/lib/security/rbac";
import { requireConsent } from "@/lib/consent/require-consent";

export default async function ApprovalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRoles(MANAGER_ROLES);
  await requireConsent("/employee/approvals");

  return <>{children}</>;
}
