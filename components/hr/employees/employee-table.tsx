"use client";

import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollableTable } from "@/components/shared/scrollable-table";
import { StatusPill } from "@/components/shared/status-pill";
import { EmployeeAvatar } from "@/components/hr/attendance/employee-avatar";
import { EmployeeRowActions } from "@/components/hr/employees/employee-row-actions";
import { useT } from "@/lib/i18n/locale-context";
import { statusTone } from "@/lib/employee/status-tones";
import { getInitials } from "@/lib/employee/initials";
import type { Employee } from "@/hooks/use-employees";

const GRID = "grid-cols-[40px_1.6fr_140px_180px_120px_120px_140px]";

interface Props {
  rows: Employee[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onView: (e: Employee) => void;
  onResetPassword: (e: Employee) => void;
  onSendEmail: (e: Employee) => void;
  isLoading: boolean;
}

export function EmployeeTable({
  rows,
  selected,
  onToggle,
  onToggleAll,
  onView,
  onResetPassword,
  onSendEmail,
  isLoading,
}: Props) {
  const t = useT();
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-(--es-shadow-sm)">
      <ScrollableTable minWidth={1000}>
        <div className={`grid ${GRID} items-center border-b border-border bg-(--es-neutral-50) px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground`}>
          <span>
            <Checkbox checked={allSelected} onCheckedChange={onToggleAll} aria-label={t.manager.selectAriaAll} />
          </span>
          <span>{t.hr.employees.colEmployee}</span>
          <span>{t.hr.department}</span>
          <span>{t.hr.employees.colPosition}</span>
          <span>{t.hr.employees.colType}</span>
          <span>{t.hr.employees.colStatus}</span>
          <span>{t.hr.actions}</span>
        </div>

        {isLoading && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`grid ${GRID} items-center border-b border-(--es-neutral-100) px-4 py-3.5`}>
            <Skeleton className="size-4 rounded" />
            <div className="flex items-center gap-2.5"><Skeleton className="size-9 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-40" /></div></div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-7 w-24" />
          </div>
        ))}

        {!isLoading && rows.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Users className="size-10 opacity-40" />
            <p className="text-sm">{t.hr.employees.noResults}</p>
          </div>
        )}

        {!isLoading && rows.map((p) => {
          const name = `${p.firstNameTh} ${p.lastNameTh}`;
          const sel = selected.has(p.id);
          return (
            <div
              key={p.id}
              className={`grid ${GRID} items-center border-b border-(--es-neutral-100) px-4 py-3.5 text-[13px] last:border-b-0 transition-colors hover:bg-muted/40 ${sel ? "bg-(--es-accent-50)/40" : ""}`}
            >
              <span>
                <Checkbox
                  checked={sel}
                  onCheckedChange={() => onToggle(p.id)}
                  aria-label={t.manager.selectAriaOne.replace("{name}", name)}
                />
              </span>

              <div className="flex min-w-0 items-center gap-2.5">
                <EmployeeAvatar seed={p.employeeCode} initials={getInitials(p)} />
                <div className="min-w-0">
                  <div className="truncate font-semibold">{name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    <span className="font-mono">{p.employeeCode}</span>
                    <span className="mx-1">·</span>
                    <span>{p.user?.email ?? "—"}</span>
                  </div>
                </div>
              </div>

              <span className="truncate">{p.department?.name ?? "—"}</span>
              <span className="truncate">{p.position?.name ?? "—"}</span>

              <span>
                {p.employmentType ? (
                  <span className="inline-flex items-center rounded-md bg-(--es-accent-50) px-2 py-0.5 text-[11px] font-medium text-(--es-accent-700)">
                    {p.employmentType}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </span>

              <span>
                <StatusPill tone={statusTone(p.employmentStatus)}>
                  {p.employmentStatus}
                </StatusPill>
              </span>

              <div className="flex gap-0.5">
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
      </ScrollableTable>
    </div>
  );
}
