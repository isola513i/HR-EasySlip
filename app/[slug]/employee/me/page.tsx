import { requireRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { MeScreen } from "@/components/employee/me-screen";
import { pageMetadata } from "@/lib/i18n/page-metadata";

export const generateMetadata = () => pageMetadata("me");

export default async function MePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireRoles(EMPLOYEE_ROLES, slug);

  return (
    <MeScreen
      user={{
        name: `${user.firstNameTh ?? ""} ${user.lastNameTh ?? ""}`.trim(),
        code: user.employeeCode ?? "",
        role: user.roles[0] ?? "EMPLOYEE",
      }}
    />
  );
}
