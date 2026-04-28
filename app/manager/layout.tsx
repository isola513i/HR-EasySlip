import type { Viewport } from "next";
import { requireRoles, MANAGER_ROLES } from "@/lib/security/rbac";
import { requireConsent } from "@/lib/consent/require-consent";
import { ManagerShell } from "@/components/manager/manager-shell";

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRoles(MANAGER_ROLES);
  await requireConsent("/manager/inbox");

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
