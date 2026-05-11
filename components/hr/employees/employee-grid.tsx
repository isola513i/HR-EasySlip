"use client";

import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusPill } from "@/components/shared/status-pill";
import { EmployeeAvatar } from "@/components/hr/attendance/employee-avatar";
import { EmployeeRowActions } from "@/components/hr/employees/employee-row-actions";
import { useT } from "@/lib/i18n/locale-context";
import { statusTone } from "@/lib/employee/status-tones";
import { getInitials } from "@/lib/employee/initials";
import type { Employee } from "@/hooks/use-employees";

interface Props {
  rows: Employee[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onView: (e: Employee) => void;
  onResetPassword: (e: Employee) => void;
  onSendEmail: (e: Employee) => void;
  isLoading: boolean;
}

export function EmployeeGrid({ rows, selected, onToggle, onView, onResetPassword, onSendEmail, isLoading }: Props) {
  const t = useT();

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[180px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-16 text-muted-foreground">
        <Users className="size-10 opacity-40" />
        <p className="text-sm">{t.hr.employees.noResults}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map((p) => {
        const name = `${p.firstNameTh} ${p.lastNameTh}`;
        const sel = selected.has(p.id);
        return (
          <div
            key={p.id}
            className={`relative rounded-xl border bg-card p-4 shadow-(--es-shadow-sm) transition-colors ${sel ? "border-(--es-accent-400)" : "border-border"}`}
          >
            <span className="absolute right-3 top-3">
              <Checkbox
                checked={sel}
                onCheckedChange={() => onToggle(p.id)}
                aria-label={t.manager.selectAriaOne.replace("{name}", name)}
              />
            </span>

            <div className="flex flex-col items-center gap-2 pt-3 text-center">
              <EmployeeAvatar seed={p.employeeCode} initials={getInitials(p)} size="lg" />
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold">{name}</div>
                <div className="truncate text-[11px] font-mono text-muted-foreground">{p.employeeCode}</div>
              </div>
              <div className="truncate text-[12px] text-muted-foreground">{p.position?.name ?? p.department?.name ?? "—"}</div>
              <div className="flex items-center gap-1.5 text-[11px]">
                {p.employmentType && (
                  <span className="inline-flex items-center rounded-md bg-(--es-accent-50) px-1.5 py-0.5 font-medium text-(--es-accent-700)">
                    {p.employmentType}
                  </span>
                )}
                <StatusPill tone={statusTone(p.employmentStatus)}>
                  {p.employmentStatus}
                </StatusPill>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-1 border-t border-(--es-neutral-100) pt-2">
              <EmployeeRowActions
                employee={p}
                name={name}
                onView={onView}
                onResetPassword={onResetPassword}
                onSendEmail={onSendEmail}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
