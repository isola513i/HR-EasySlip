"use client";

import { Calendar, Check, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeAvatar } from "@/components/hr/attendance/employee-avatar";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import type { HrOvertimeRow } from "@/hooks/use-hr-overtime";

interface Props {
  rows: HrOvertimeRow[];
  isLoading: boolean;
  onApprove: (row: HrOvertimeRow) => void;
  onReject: (row: HrOvertimeRow) => void;
}

function timeRange(row: HrOvertimeRow, formatTime: (iso: string) => string): string | null {
  if (!row.assignedStart || !row.assignedEnd) return null;
  return `${formatTime(row.assignedStart)} – ${formatTime(row.assignedEnd)}`;
}

export function PendingOvertimeList({ rows, isLoading, onApprove, onReject }: Props) {
  const t = useT();
  const fmt = useFormat();
  const u = t.hr.overtime.hoursUnit;

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
      <div className="border-b border-border px-5 py-4 text-base font-semibold">
        {t.hr.overtime.pendingTitle}
      </div>

      <div className="flex flex-col gap-2.5 p-4">
        {isLoading && Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-lg" />
        ))}

        {!isLoading && rows.length === 0 && (
          <div className="px-2 py-10 text-center text-sm text-muted-foreground">
            {t.hr.overtime.pendingEmpty}
          </div>
        )}

        {!isLoading && rows.map((r) => {
          const name = `${r.employee.firstNameTh} ${r.employee.lastNameTh}`;
          const initials = `${r.employee.firstNameTh.charAt(0)}${r.employee.lastNameTh.charAt(0)}`;
          const time = timeRange(r, fmt.formatTime);
          const hours = r.hoursApproved ?? "—";
          return (
            <div key={r.id} className="rounded-lg border border-border bg-card p-3.5">
              <div className="flex items-start gap-3">
                <EmployeeAvatar seed={r.employee.employeeCode} initials={initials} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold">{name}</span>
                    <span className="inline-flex items-center rounded-md bg-[var(--es-info-50)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--es-info-600)] tabular-nums">
                      {hours}{u}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Calendar className="size-3.5" />
                      {fmt.formatShortDate(r.date, "numeric")}
                    </span>
                    {time && (
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Clock className="size-3.5" />
                        {time}
                      </span>
                    )}
                  </div>
                  {r.reason && (
                    <div className="mt-1.5 line-clamp-1 text-[13px]">{r.reason}</div>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1"
                    onClick={() => onReject(r)}
                  >
                    <X className="size-3.5" /> {t.manager.reject}
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => onApprove(r)}
                  >
                    <Check className="size-3.5" /> {t.manager.approve}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
