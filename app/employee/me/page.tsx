import type { Metadata } from "next";
import { requireRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { MeScreen } from "@/components/employee/me-screen";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.metadata.pageTitles.me };
}

export default async function MePage() {
  const user = await requireRoles(EMPLOYEE_ROLES);

  return (
    <MeScreen
      user={{
        name: `${user.firstNameTh ?? ""} ${user.lastNameTh ?? ""}`.trim(),
        code: user.employeeCode ?? "",
        role: user.roles[0] ?? "EMPLOYEE",
        email: user.email ?? "",
      }}
    />
  );
}
