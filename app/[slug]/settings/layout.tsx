import type { Metadata } from "next";
import { requireRoles, TENANT_ADMIN_ROLES } from "@/lib/security/rbac";
import { SettingsShell } from "@/components/tenant/settings-shell";

export const metadata: Metadata = { title: "Settings — EasySlip" };

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireRoles(TENANT_ADMIN_ROLES, slug);

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
