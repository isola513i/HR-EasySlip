import type { Metadata } from "next";
import { requireRoles, TENANT_ADMIN_ROLES } from "@/lib/security/rbac";
import { SettingsShell } from "@/components/tenant/settings-shell";

export const metadata: Metadata = { title: "Settings — EasySlip" };

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRoles(TENANT_ADMIN_ROLES);

  const name = `${user.firstNameTh ?? ""} ${user.lastNameTh ?? ""}`.trim();

  return (
    <SettingsShell
      user={{
        id: user.userId,
        name,
        role: user.roles[0] ?? "TENANT_ADMIN",
      }}
    >
      {children}
    </SettingsShell>
  );
}
