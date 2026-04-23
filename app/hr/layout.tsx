import { requireRoles, HR_ROLES } from "@/lib/security/rbac";
import { requireConsent } from "@/lib/consent/require-consent";
import { HRShell } from "@/components/hr/hr-shell";

export default async function HRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRoles(HR_ROLES);
  await requireConsent("/hr/overview");

  return (
    <HRShell
      user={{
        name: `${user.firstNameTh ?? ""} ${user.lastNameTh ?? ""}`.trim(),
        role: user.roles[0] ?? "HR_AUTHORIZED",
      }}
    >
      {children}
    </HRShell>
  );
}
