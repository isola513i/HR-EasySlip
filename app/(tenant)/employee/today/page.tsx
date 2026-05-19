import type { Metadata } from "next";
import { requireRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { EmployeeHome } from "@/components/employee/home-screen";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return { title: t.employee.todayTitle };
}

export default async function EmployeeTodayPage() {
  const user = await requireRoles(EMPLOYEE_ROLES);
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <EmployeeHome
      user={{
        name: `${user.firstNameTh ?? ""} ${user.lastNameTh ?? ""}`.trim(),
        code: user.employeeCode ?? "",
        role: user.roles[0] ?? "EMPLOYEE",
      }}
      dict={t}
    />
  );
}
