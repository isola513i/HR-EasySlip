import type { Metadata } from "next";
import { requireRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { MeScreen } from "@/components/employee/me-screen";

export const metadata: Metadata = { title: "Profile" };

export default async function MePage() {
  const user = await requireRoles(EMPLOYEE_ROLES);

  return (
    <MeScreen
      user={{
        name: `${user.firstNameTh ?? ""} ${user.lastNameTh ?? ""}`.trim(),
        code: user.employeeCode ?? "",
        role: user.roles[0] ?? "EMPLOYEE",
        email: "",
      }}
    />
  );
}
