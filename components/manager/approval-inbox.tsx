"use client";

import { useState, useCallback } from "react";
import { Check, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/shared/status-pill";
import { SearchInput } from "@/components/shared/search-input";
import { cn, formatLeaveType } from "@/lib/utils";
import { DetailSheet } from "@/components/manager/detail-sheet";
import { RejectDialog } from "@/components/manager/reject-dialog";
import { useApprovalInbox } from "@/hooks/use-approval-inbox";
import { useT } from "@/lib/i18n/locale-context";
import type { ApprovalRow } from "@/types/manager";

export function ApprovalInbox() {
  const t = useT();
  const { rows, isLoading, error: fetchError, approve, reject, bulkDecision } = useApprovalInbox();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailRow, setDetailRow] = useState<ApprovalRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ApprovalRow | null>(null);
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)),
    );
  }, [rows]);

  const handleApprove = useCallback(async (id: string) => {
    try { await approve(id); toast.success(t.manager.approved); setSelected(new Set()); }
    catch { toast.error(t.manager.approveFailed); }
  }, [approve]);

  const handleReject = useCallback(async (reason: string) => {
    if (!rejectTarget) return;
    try { await reject(rejectTarget.id, reason); toast.success(t.manager.rejected); setSelected(new Set()); }
    catch { toast.error(t.manager.rejectFailed); }
  }, [rejectTarget, reject]);

  const handleBulkApprove = useCallback(async () => {
    try {
      const results = await bulkDecision(Array.from(selected), "APPROVED");
      const ok = results.filter((r) => r.ok).length;
      const fail = results.length - ok;
      if (fail === 0) toast.success(t.manager.bulkApproved.replace("{ok}", String(ok)));
      else if (ok === 0) toast.error(t.manager.bulkFailed.replace("{fail}", String(fail)));
      else toast.warning(t.manager.bulkMixed.replace("{ok}", String(ok)).replace("{fail}", String(fail)));
      setSelected(new Set());
    } catch { toast.error(t.manager.actionFailed); }
  }, [selected, bulkDecision]);

  const handleBulkReject = useCallback(async (reason: string) => {
    try {
      const results = await bulkDecision(Array.from(selected), "REJECTED", reason);
      const ok = results.filter((r) => r.ok).length;
      const fail = results.length - ok;
      if (fail === 0) toast.success(t.manager.bulkRejected.replace("{ok}", String(ok)));
      else if (ok === 0) toast.error(t.manager.bulkFailed.replace("{fail}", String(fail)));
      else toast.warning(t.manager.bulkMixed.replace("{ok}", String(ok)).replace("{fail}", String(fail)));
      setSelected(new Set());
      setBulkRejectOpen(false);
    } catch { toast.error(t.manager.actionFailed); }
  }, [selected, bulkDecision]);

  const stop = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  if (isLoading) return (
    <div className="flex flex-col gap-3 p-4">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
    </div>
  );

  if (fetchError) return (
    <div className="py-20 text-center text-[var(--es-error-500)]">{fetchError}</div>
  );

  if (rows.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
      <CheckCircle className="size-10 opacity-40" />
      <p className="text-sm">{t.manager.noPending}</p>
    </div>
  );

  return (
    <div className="relative">
      <div className="mb-4 flex items-center gap-2.5">
        <SearchInput placeholder={t.manager.searchPlaceholder} />
        <StatusPill tone="neutral" dot={false}>{`${t.common.all} (${rows.length})`}</StatusPill>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
        <div className="grid grid-cols-[40px_1fr_140px_170px_80px_100px_90px] items-center border-b border-border bg-[var(--es-neutral-50)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <Checkbox checked={selected.size === rows.length && rows.length > 0} onCheckedChange={toggleAll} aria-label="Select all" />
          <span>{t.manager.employee}</span><span>{t.manager.type}</span><span>{t.manager.dates}</span><span>{t.manager.daysCol}</span><span>{t.manager.submitted}</span><span />
        </div>

        {rows.map((r) => {
          const sel = selected.has(r.id);
          const name = `${r.employee.firstNameTh} ${r.employee.lastNameTh}`;
          return (
            <div key={r.id} onClick={() => setDetailRow(r)} className={cn(
              "grid cursor-pointer grid-cols-[40px_1fr_140px_170px_80px_100px_90px] items-center border-b border-[var(--es-neutral-100)] px-4 py-3.5 text-[13px] transition-colors hover:bg-muted/50",
              sel && "bg-[var(--es-accent-50)]",
            )}>
              <span onClick={stop}><Checkbox checked={sel} onCheckedChange={() => toggle(r.id)} aria-label={`Select ${name}`} /></span>
              <div>
                <div className="font-semibold">{name}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{r.employee.employeeCode}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <span>{formatLeaveType(r.leaveType)}</span>
                {r.attachmentUrl && <StatusPill tone="info" dot={false}>PDF</StatusPill>}
              </div>
              <div>
                <div>{new Date(r.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – {new Date(r.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                <div className="truncate text-[11px] text-muted-foreground">{r.reason}</div>
              </div>
              <div className="tabular-nums font-semibold">{r.daysRequested}</div>
              <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
              <div className="flex justify-end gap-0.5">
                <button title={t.manager.approve} aria-label={`${t.manager.approve} ${name}`} onClick={(e) => { stop(e); handleApprove(r.id); }} className="rounded-md p-1.5 text-[var(--es-success-600)] transition-colors hover:bg-[var(--es-success-50)]"><Check className="size-4" /></button>
                <button title={t.manager.reject} aria-label={`${t.manager.reject} ${name}`} onClick={(e) => { stop(e); setRejectTarget(r); }} className="rounded-md p-1.5 text-[var(--es-error-500)] transition-colors hover:bg-[var(--es-error-50)]"><X className="size-4" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-30 mx-auto w-fit">
          <div className="flex items-center gap-3 rounded-[10px] border border-border bg-card px-3 py-2.5 shadow-[0_10px_40px_-10px_rgba(16,24,40,0.25),0_2px_6px_rgba(16,24,40,0.08)]">
            <div className="text-[13px]"><b className="tabular-nums font-semibold">{selected.size}</b><span className="text-muted-foreground"> {t.manager.selected}</span></div>
            <div className="h-5 w-px bg-border" />
            <button onClick={() => setSelected(new Set())} className="rounded-md border border-[var(--es-neutral-300)] bg-card px-3 py-[7px] text-[13px] font-medium transition-colors hover:bg-muted">{t.common.cancel}</button>
            <button onClick={() => setBulkRejectOpen(true)} className="flex items-center gap-1.5 rounded-md border border-[var(--es-error-500)] bg-card px-3 py-[7px] text-[13px] font-semibold text-[var(--es-error-500)] transition-colors hover:bg-[var(--es-error-50)]"><X className="size-3.5" /> {t.manager.rejectAll}</button>
            <button onClick={handleBulkApprove} className="flex items-center gap-1.5 rounded-md bg-[var(--es-accent-600)] px-3.5 py-[7px] text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(61,70,204,0.2)] transition-colors hover:bg-[var(--es-accent-700)]"><Check className="size-3.5" /> {t.manager.approveAll}</button>
          </div>
        </div>
      )}

      <DetailSheet row={detailRow} onClose={() => setDetailRow(null)} onApprove={handleApprove} onReject={(id) => setRejectTarget(rows.find((r) => r.id === id) ?? null)} />
      <RejectDialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={handleReject} employeeName={rejectTarget ? `${rejectTarget.employee.firstNameTh} ${rejectTarget.employee.lastNameTh}` : undefined} />
      <RejectDialog open={bulkRejectOpen} onClose={() => setBulkRejectOpen(false)} onConfirm={handleBulkReject} employeeName={`${selected.size} requests`} />
    </div>
  );
}
