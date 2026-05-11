import { cn } from "@/lib/utils";

type RoleKey =
  | "EMPLOYEE"
  | "MANAGER"
  | "HRMG"
  | "HR_AUTHORIZED"
  | "CEO"
  | "CTO"
  | "COO"
  | "ADMIN";

const roleStyles: Record<string, string> = {
  EMPLOYEE:
    "bg-(--es-role-employee-bg) text-(--es-role-employee-fg)",
  MANAGER: "bg-(--es-role-manager-bg) text-(--es-role-manager-fg)",
  HRMG: "bg-(--es-role-hrmg-bg) text-(--es-role-hrmg-fg)",
  HR_AUTHORIZED: "bg-(--es-role-hr-bg) text-(--es-role-hr-fg)",
  CEO: "bg-(--es-role-admin-bg) text-(--es-role-admin-fg)",
  CTO: "bg-(--es-role-admin-bg) text-(--es-role-admin-fg)",
  COO: "bg-(--es-role-admin-bg) text-(--es-role-admin-fg)",
  ADMIN: "bg-(--es-role-admin-bg) text-(--es-role-admin-fg)",
};

interface RoleBadgeProps {
  role: RoleKey | string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const style = roleStyles[role] ?? roleStyles.EMPLOYEE;
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        style,
        className,
      )}
    >
      <span className="size-[5px] rounded-full bg-current opacity-70" />
      {role}
    </span>
  );
}
