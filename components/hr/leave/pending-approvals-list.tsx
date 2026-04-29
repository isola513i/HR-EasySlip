"use client";

import { useState, useMemo, useCallback } from "react";
import { Calendar, Clock, Filter as FilterIcon, Check, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmployeeAvatar } from "@/components/hr/attendance/employee-avatar";
import { RejectDialog } from "@/components/manager/reject-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatShortDate } from "@/lib/format";
import { useT } from "@/lib/i18n/locale-context";
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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [rejectTarget, setRejectTarget] = useState<PendingLeaveRow | null>(null);
  const [approveTarget, setApproveTarget] = useState<PendingLeaveRow | null>(null);

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
    <div className="rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="text-base font-semibold">{t.hr.leave.pendingApprovals}</div>
        <Popover>
          <PopoverTrigger className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
            <FilterIcon className="size-4 text-muted-foreground" />
            {t.hr.leave.filter}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{t.hr.leave.leaveType}</div>
            <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v as TypeFilter)}>
              <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t.common.all}</SelectItem>
                <SelectItem value="ANNUAL">{t.leave.annual}</SelectItem>
                <SelectItem value="SICK">{t.leave.sick}</SelectItem>
                <SelectItem value="PERSONAL">{t.leave.personal}</SelectItem>
                <SelectItem value="OTHER">{t.hr.leave.otherTypes}</SelectItem>
              </SelectContent>
            </Select>
          </PopoverContent>
        </Popover>
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
                      {formatShortDate(r.startDate, "numeric")} – {formatShortDate(r.endDate, "numeric")}
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock className="size-3.5" />
                      {r.daysRequested} {t.hr.leave.daysUnit}
                    </span>
                  </div>
                  {r.reason && <div className="mt-1.5 line-clamp-2 text-[13px]">{r.reason}</div>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => setRejectTarget(r)}>
                    <X className="size-3.5" />{t.manager.reject}
                  </Button>
                  <Button size="sm" className="gap-1" onClick={() => setApproveTarget(r)}>
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
      <ConfirmDialog
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        title={t.hr.leave.confirmApproveTitle}
        description={approveTarget ? `${approveTarget.employee.firstNameTh} ${approveTarget.employee.lastNameTh} · ${approveTarget.daysRequested} ${t.hr.leave.daysUnit}` : undefined}
        confirmLabel={t.manager.approve}
      />
    </div>
  );
}
