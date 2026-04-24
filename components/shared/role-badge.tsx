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
    "bg-[var(--es-role-employee-bg)] text-[var(--es-role-employee-fg)]",
  MANAGER: "bg-[var(--es-role-manager-bg)] text-[var(--es-role-manager-fg)]",
  HRMG: "bg-[var(--es-role-hrmg-bg)] text-[var(--es-role-hrmg-fg)]",
  HR_AUTHORIZED: "bg-[var(--es-role-hr-bg)] text-[var(--es-role-hr-fg)]",
  CEO: "bg-[var(--es-role-admin-bg)] text-[var(--es-role-admin-fg)]",
  CTO: "bg-[var(--es-role-admin-bg)] text-[var(--es-role-admin-fg)]",
  COO: "bg-[var(--es-role-admin-bg)] text-[var(--es-role-admin-fg)]",
  ADMIN: "bg-[var(--es-role-admin-bg)] text-[var(--es-role-admin-fg)]",
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
