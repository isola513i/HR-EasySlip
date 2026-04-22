import { requireRoles, MANAGER_ROLES } from "@/lib/security/rbac";
import { ManagerShell } from "@/components/manager/manager-shell";

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRoles(MANAGER_ROLES);

  return (
    <ManagerShell
      user={{
        name: `${user.firstNameTh ?? ""} ${user.lastNameTh ?? ""}`.trim(),
        role: user.roles[0] ?? "MANAGER",
      }}
    >
      {children}
    </ManagerShell>
  );
}
