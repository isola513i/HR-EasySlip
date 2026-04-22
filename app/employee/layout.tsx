import { requireRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { BottomNav } from "@/components/employee/bottom-nav";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRoles(EMPLOYEE_ROLES);

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background">
      <div className="pb-20">{children}</div>
      <BottomNav />
    </div>
  );
}
