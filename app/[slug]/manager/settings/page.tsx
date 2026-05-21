import type { Metadata } from "next";
import { requireRoles, MANAGER_ROLES } from "@/lib/security/rbac";
import { ManagerSettingsView } from "@/components/manager/manager-settings-view";

export const metadata: Metadata = { title: "Settings" };

export default async function ManagerSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireRoles(MANAGER_ROLES, slug);

  return (
    <ManagerSettingsView
      user={{
        name: `${user.firstNameTh ?? ""} ${user.lastNameTh ?? ""}`.trim(),
        code: user.employeeCode ?? "",
        role: user.roles[0] ?? "MANAGER",
        email: user.email ?? "",
      }}
    />
  );
}
