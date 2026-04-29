"use client";

import { useState, useCallback } from "react";
import { Check, X, CheckCircle, Paperclip, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { RejectDialog } from "@/components/manager/reject-dialog";
import { useTimeAdjustmentInbox } from "@/hooks/use-time-adjustment-inbox";
import { useT } from "@/lib/i18n/locale-context";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";
import { formatDateTime } from "@/lib/format";
import type { TimeAdjustmentRow } from "@/types/manager-inbox";

export function TimeAdjustmentInbox() {
  const t = useT();
  const { rows, isLoading, error, approve, reject } = useTimeAdjustmentInbox();
  const [rejectTarget, setRejectTarget] = useState<TimeAdjustmentRow | null>(null);

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
        const Icon = r.clockType === "IN" ? LogIn : LogOut;
        return (
          <div key={r.id} className="rounded-xl border border-border bg-card p-3.5 shadow-[var(--es-shadow-sm)]">
            <div className="flex items-start gap-2.5">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{name}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{r.employee.employeeCode}</span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {t.manager.timeAdjustment.requested}: <span className="text-foreground tabular-nums">{formatDateTime(r.requestedAt)}</span>
                  {" · "}
                  {r.clockType === "IN" ? t.manager.timeAdjustment.clockIn : t.manager.timeAdjustment.clockOut}
                </div>
                <div className="mt-1 line-clamp-2 text-xs">{r.reason}</div>
                {r.attachmentUrl && (
                  <a href={r.attachmentUrl} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[var(--es-accent-600)] hover:underline">
                    <Paperclip className="size-3" /> {t.manager.timeAdjustment.attachment}
                  </a>
                )}
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
