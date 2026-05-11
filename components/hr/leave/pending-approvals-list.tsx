"use client";

import { useState, useMemo, useCallback } from "react";
import { Calendar, Clock, Check, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmployeeAvatar } from "@/components/hr/attendance/employee-avatar";
import { RejectDialog } from "@/components/manager/reject-dialog";
import { ApproveLeaveDialog } from "@/components/hr/leave/approve-leave-dialog";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";
import type { PendingLeaveRow } from "@/lib/leave/leave-org-stats-service";

interface Props {
  rows: PendingLeaveRow[];
  isLoading: boolean;
  approve: (id: string) => Promise<void>;
  reject: (id: string, reason: string) => Promise<void>;
}

type TypeFilter = "ALL" | "ANNUAL" | "SICK" | "PERSONAL" | "OTHER";

export function PendingApprovalsList({ rows, isLoading, approve, reject }: Props) {
  const t = useT();
  const fmt = useFormat();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [rejectTarget, setRejectTarget] = useState<PendingLeaveRow | null>(null);
  const [approveTarget, setApproveTarget] = useState<PendingLeaveRow | null>(null);

  const FILTER_STYLE: Record<TypeFilter, { active: string; inactive: string }> = {
    ALL:      { active: "bg-(--es-neutral-900) text-white border-transparent", inactive: "border-(--es-neutral-300) text-muted-foreground hover:bg-muted" },
    ANNUAL:   { active: "bg-(--es-accent-600) text-white border-transparent", inactive: "border-(--es-accent-200) text-(--es-accent-700) hover:bg-(--es-accent-50)" },
    SICK:     { active: "bg-(--es-error-500) text-white border-transparent",  inactive: "border-(--es-error-200) text-(--es-error-600) hover:bg-(--es-error-50)" },
    PERSONAL: { active: "bg-(--es-warn-500) text-white border-transparent",   inactive: "border-(--es-warn-200) text-(--es-warn-700) hover:bg-(--es-warn-50)" },
    OTHER:    { active: "bg-(--es-neutral-500) text-white border-transparent", inactive: "border-(--es-neutral-300) text-muted-foreground hover:bg-muted" },
  };

  const filters: Array<{ value: TypeFilter; label: string }> = [
    { value: "ALL", label: t.common.all },
    { value: "ANNUAL", label: t.leave.annual },
    { value: "SICK", label: t.leave.sick },
    { value: "PERSONAL", label: t.leave.personal },
    { value: "OTHER", label: t.hr.leave.otherTypes },
  ];

  const counts = useMemo(() => {
    const acc: Record<TypeFilter, number> = { ALL: rows.length, ANNUAL: 0, SICK: 0, PERSONAL: 0, OTHER: 0 };
    for (const r of rows) {
      if (r.leaveType === "ANNUAL" || r.leaveType === "SICK" || r.leaveType === "PERSONAL") {
        acc[r.leaveType] += 1;
      } else {
        acc.OTHER += 1;
      }
    }
    return acc;
  }, [rows]);

  const filtered = useMemo(() => {
    if (typeFilter === "ALL") return rows;
    if (typeFilter === "OTHER") {
      return rows.filter((r) => !["ANNUAL", "SICK", "PERSONAL"].includes(r.leaveType));
    }
    return rows.filter((r) => r.leaveType === typeFilter);
  }, [rows, typeFilter]);

  const handleApprove = useCallback(async () => {
    if (!approveTarget) return;
    hapticTap();
    try {
      await approve(approveTarget.id);
      hapticSuccess();
      toast.success(t.manager.approved);
    } catch {
      hapticError();
      toast.error(t.manager.approveFailed);
    }
  }, [approveTarget, approve, t.manager.approved, t.manager.approveFailed]);

  const handleReject = useCallback(async (reason: string) => {
    if (!rejectTarget) return;
    hapticTap();
    try {
      await reject(rejectTarget.id, reason);
      hapticSuccess();
      toast.success(t.manager.rejected);
    } catch {
      hapticError();
      toast.error(t.manager.rejectFailed);
    }
  }, [rejectTarget, reject, t.manager.rejected, t.manager.rejectFailed]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-(--es-shadow-sm)">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-base font-semibold">{t.hr.leave.pendingApprovals}</div>
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map((f) => {
            const active = typeFilter === f.value;
            const count = counts[f.value];
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setTypeFilter(f.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-[5px] text-[12px] font-medium transition-colors",
                  active ? FILTER_STYLE[f.value].active : `bg-card ${FILTER_STYLE[f.value].inactive}`,
                )}
              >
                {f.label}
                <span className={cn("tabular-nums text-[11px]", active ? "text-white/70" : "opacity-60")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 p-5">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-lg" />)}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <CheckCircle2 className="size-10 opacity-40" />
            <p className="text-sm">{t.hr.leave.noPending}</p>
          </div>
        )}
        {!isLoading && filtered.map((r) => {
          const name = `${r.employee.firstNameTh} ${r.employee.lastNameTh}`;
          const initials = `${r.employee.firstNameTh.charAt(0)}${r.employee.lastNameTh.charAt(0)}`;
          const typeLabel = t.leave[r.leaveType.toLowerCase() as keyof typeof t.leave] ?? r.leaveType;
          return (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start gap-3">
                <EmployeeAvatar seed={r.employee.employeeCode} initials={initials} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                    <span className="text-[15px] font-semibold">{name}</span>
                    <span className="text-[13px] text-muted-foreground">{String(typeLabel)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Calendar className="size-3.5" />
                      {fmt.formatShortDate(r.startDate, "numeric")} – {fmt.formatShortDate(r.endDate, "numeric")}
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock className="size-3.5" />
                      {r.daysRequested} {t.hr.leave.daysUnit}
                    </span>
                  </div>
                  {r.reason && <div className="mt-1.5 line-clamp-2 text-[13px]">{r.reason}</div>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="destructive" size="sm" className="gap-1" onClick={() => setRejectTarget(r)}>
                    <X className="size-3.5" />{t.manager.reject}
                  </Button>
                  <Button variant="success" size="sm" className="gap-1" onClick={() => setApproveTarget(r)}>
                    <Check className="size-3.5" />{t.manager.approve}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <RejectDialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        employeeName={rejectTarget ? `${rejectTarget.employee.firstNameTh} ${rejectTarget.employee.lastNameTh}` : undefined}
      />
      <ApproveLeaveDialog
        row={approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
      />
    </div>
  );
}
