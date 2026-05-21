import type { Viewport } from "next";
import { headers } from "next/headers";
import { requireRoles, HR_ROLES } from "@/lib/security/rbac";
import { requireConsent } from "@/lib/consent/require-consent";
import { HRShell } from "@/components/hr/hr-shell";

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function HRLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireRoles(HR_ROLES, slug);
  await requireConsent(`/${slug}/hr/overview`, slug);

  const hdrs = await headers();
  const hidePayroll = hdrs.get("x-impersonation") === "1";

  return (
    <HRShell
      user={{
        id: user.userId,
        name: `${user.firstNameTh ?? ""} ${user.lastNameTh ?? ""}`.trim(),
        role: user.roles[0] ?? "HR_AUTHORIZED",
      }}
      hidePayroll={hidePayroll}
    >
      {children}
    </HRShell>
  );
}
