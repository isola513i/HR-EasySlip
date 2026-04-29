"use client";

import { useState, useCallback } from "react";
import { Check, X, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/shared/status-pill";
import { RejectDialog } from "@/components/manager/reject-dialog";
import { useOvertimeInbox } from "@/hooks/use-overtime-inbox";
import { useT } from "@/lib/i18n/locale-context";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";
import { formatTime, formatShortDate } from "@/lib/format";
import type { OvertimeRow } from "@/types/manager-inbox";

export function OvertimeInbox() {
  const t = useT();
  const { rows, isLoading, error, approve, reject } = useOvertimeInbox();
  const [rejectTarget, setRejectTarget] = useState<OvertimeRow | null>(null);

  const handleApprove = useCallback(async (id: string) => {
    hapticTap();
    try {
      await approve(id);
      hapticSuccess();
      toast.success(t.manager.approved);
    } catch {
      hapticError();
      toast.error(t.manager.approveFailed);
    }
  }, [approve, t.manager.approved, t.manager.approveFailed]);

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

  if (isLoading) return (
    <div className="flex flex-col gap-3 p-4">
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
    </div>
  );

  if (error) return (
    <div className="py-20 text-center text-[var(--es-error-500)]">{error}</div>
  );

  if (rows.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
      <CheckCircle className="size-10 opacity-40" />
      <p className="text-sm">{t.manager.noPending}</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const name = `${r.employee.firstNameTh} ${r.employee.lastNameTh}`;
        const typeLabel = t.manager.overtime[r.overtimeType];
        // HOLIDAY uses assigned (manager-set) range; WEEKDAY uses actual scan range.
        const startIso = r.assignedStart ?? r.actualStart;
        const endIso = r.assignedEnd ?? r.actualEnd;
        const range = startIso && endIso
          ? `${formatTime(startIso)} – ${formatTime(endIso)}`
          : null;
        const hours = r.hoursApproved;
        return (
          <div key={r.id} className="rounded-xl border border-border bg-card p-3.5 shadow-[var(--es-shadow-sm)]">
            <div className="flex items-start gap-2.5">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
                <Clock className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{name}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{r.employee.employeeCode}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="text-foreground tabular-nums">{formatShortDate(r.date, "numeric")}</span>
                  <span>·</span>
                  <StatusPill tone="info" dot={false}>{typeLabel}</StatusPill>
                  <span>·</span>
                  <span className="tabular-nums">×{r.rateMultiplier}</span>
                  {range && (<>
                    <span>·</span>
                    <span className="tabular-nums">{range}</span>
                  </>)}
                  {hours && (<>
                    <span>·</span>
                    <span className="tabular-nums">{hours}h</span>
                  </>)}
                </div>
                <div className="mt-1 line-clamp-2 text-xs">{r.reason}</div>
              </div>
              <div className="flex shrink-0 gap-0.5">
                <button
                  title={t.manager.approve}
                  aria-label={`${t.manager.approve} ${name}`}
                  onClick={() => handleApprove(r.id)}
                  className="rounded-md p-2 text-[var(--es-success-600)] transition-colors hover:bg-[var(--es-success-50)]"
                >
                  <Check className="size-4" />
                </button>
                <button
                  title={t.manager.reject}
                  aria-label={`${t.manager.reject} ${name}`}
                  onClick={() => setRejectTarget(r)}
                  className="rounded-md p-2 text-[var(--es-error-500)] transition-colors hover:bg-[var(--es-error-50)]"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
      <RejectDialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        employeeName={rejectTarget ? `${rejectTarget.employee.firstNameTh} ${rejectTarget.employee.lastNameTh}` : undefined}
      />
    </div>
  );
}
