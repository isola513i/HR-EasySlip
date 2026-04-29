"use client";

import { useState, useCallback } from "react";
import { Check, X, Clock, FileBarChart, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/shared/status-pill";
import { ScrollableTable } from "@/components/shared/scrollable-table";
import { RejectDialog } from "@/components/manager/reject-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useHrOvertime, type OTStatusFilter, type HrOvertimeRow } from "@/hooks/use-hr-overtime";
import { useT } from "@/lib/i18n/locale-context";
import { formatShortDate } from "@/lib/format";

const FILTERS = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const satisfies readonly OTStatusFilter[];
const GRID = "grid-cols-[1.3fr_90px_110px_70px_80px_1.4fr_100px_90px]";

const STATUS_TONE: Record<HrOvertimeRow["status"], "info" | "success" | "error" | "neutral"> = {
  PENDING: "info",
  APPROVED: "success",
  REJECTED: "error",
  CANCELLED: "neutral",
  WITHDRAWN: "neutral",
};

export function OvertimeOverview() {
  const t = useT();
  const { rows, summary, status, setStatus, isLoading, error, approve, reject } = useHrOvertime();
  const [rejectTarget, setRejectTarget] = useState<HrOvertimeRow | null>(null);
  const [approveTarget, setApproveTarget] = useState<HrOvertimeRow | null>(null);

  const handleApprove = useCallback(async () => {
    if (!approveTarget) return;
    try {
      await approve(approveTarget.id);
      toast.success(t.hr.overtime.overrideApproved);
    } catch {
      toast.error(t.manager.approveFailed);
    }
  }, [approveTarget, approve, t.hr.overtime.overrideApproved, t.manager.approveFailed]);

  const handleReject = useCallback(async (reason: string) => {
    if (!rejectTarget) return;
    try {
      await reject(rejectTarget.id, reason);
      toast.success(t.hr.overtime.overrideRejected);
    } catch {
      toast.error(t.manager.rejectFailed);
    }
  }, [rejectTarget, reject, t.hr.overtime.overrideRejected, t.manager.rejectFailed]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <FileBarChart className="size-3.5" /> {t.hr.overtime.totalRecords}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{summary.totalRecords}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <Clock className="size-3.5" /> {t.hr.overtime.totalHours}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{summary.totalHours.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((s) => {
          const active = s === status;
          const label = s === "ALL" ? t.common.all : t.hr.overtime.status[s];
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-[var(--es-accent-600)] bg-[var(--es-accent-50)] text-[var(--es-accent-700)]"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              {label}
            </button>
          );
        })}
        {status === "PENDING" && (
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <ShieldAlert className="size-3.5" /> {t.hr.overtime.overrideHint}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
        </div>
      ) : error ? (
        <div className="py-12 text-center text-[var(--es-error-500)]">{error}</div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">{t.hr.overtime.empty}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
          <ScrollableTable minWidth={1000}>
            <div className={`grid ${GRID} items-center border-b border-border bg-[var(--es-neutral-50)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground`}>
              <span>{t.manager.employee}</span>
              <span>{t.manager.dates}</span>
              <span>{t.hr.overtime.colType}</span>
              <span>{t.hr.overtime.colHours}</span>
              <span>{t.hr.overtime.colRate}</span>
              <span>{t.hr.overtime.colReason}</span>
              <span>{t.manager.status}</span>
              <span />
            </div>
            {rows.map((r) => {
              const name = `${r.employee.firstNameTh} ${r.employee.lastNameTh}`;
              const isPending = r.status === "PENDING";
              return (
                <div key={r.id} className={`grid ${GRID} items-center border-b border-[var(--es-neutral-100)] px-4 py-3 text-[13px]`}>
                  <div>
                    <div className="font-semibold">{name}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{r.employee.employeeCode}</div>
                  </div>
                  <div className="tabular-nums">{formatShortDate(r.date, "2-digit")}</div>
                  <div>{t.manager.overtime[r.overtimeType]}</div>
                  <div className="tabular-nums">{r.hoursApproved ?? "—"}</div>
                  <div className="tabular-nums">×{r.rateMultiplier}</div>
                  <div className="line-clamp-2 text-xs text-muted-foreground">{r.reason}</div>
                  <div>
                    <StatusPill tone={STATUS_TONE[r.status]} dot>
                      {t.hr.overtime.status[r.status]}
                    </StatusPill>
                  </div>
                  <div className="flex justify-end gap-0.5">
                    {isPending && (
                      <>
                        <button
                          title={`${t.manager.approve} (HR override)`}
                          aria-label={`${t.manager.approve} ${name}`}
                          onClick={() => setApproveTarget(r)}
                          className="rounded-md p-1.5 text-[var(--es-success-600)] transition-colors hover:bg-[var(--es-success-50)]"
                        >
                          <Check className="size-4" />
                        </button>
                        <button
                          title={`${t.manager.reject} (HR override)`}
                          aria-label={`${t.manager.reject} ${name}`}
                          onClick={() => setRejectTarget(r)}
                          className="rounded-md p-1.5 text-[var(--es-error-500)] transition-colors hover:bg-[var(--es-error-50)]"
                        >
                          <X className="size-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </ScrollableTable>
        </div>
      )}

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
        title={t.hr.overtime.confirmHrApprove}
        confirmLabel={t.manager.approve}
      />
    </div>
  );
}
