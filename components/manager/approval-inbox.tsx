"use client";

import { CheckCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/shared/status-pill";
import { SearchInput } from "@/components/shared/search-input";
import { ScrollableTable } from "@/components/shared/scrollable-table";
import { ApprovalRowMobile, ApprovalRowDesktop } from "@/components/manager/approval-row";
import { BulkActionBar } from "@/components/manager/bulk-action-bar";
import { DetailSheet } from "@/components/manager/detail-sheet";
import { RejectDialog } from "@/components/manager/reject-dialog";
import { useApprovalInboxState } from "@/hooks/use-approval-inbox-state";
import { useT } from "@/lib/i18n/locale-context";

export function ApprovalInbox() {
  const t = useT();
  const s = useApprovalInboxState();

  if (s.isLoading) return (
    <div className="flex flex-col gap-3 p-4">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
    </div>
  );

  if (s.error) return (
    <div className="py-20 text-center text-[var(--es-error-500)]">{s.error}</div>
  );

  if (s.rows.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
      <CheckCircle className="size-10 opacity-40" />
      <p className="text-sm">{t.manager.noPending}</p>
    </div>
  );

  return (
    <div className="relative">
      <div className="mb-4 flex items-center gap-2.5">
        <SearchInput placeholder={t.manager.searchPlaceholder} value={s.query} onChange={s.setQuery} />
        <StatusPill tone="neutral" dot={false}>{`${t.common.all} (${s.visibleRows.length})`}</StatusPill>
      </div>

      {s.visibleRows.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">{t.common.noResults}</div>
      )}

      <div className="space-y-2 md:hidden">
        {s.visibleRows.map((r) => (
          <ApprovalRowMobile
            key={r.id}
            row={r}
            selected={s.selected.has(r.id)}
            exiting={s.exitingIds.has(r.id)}
            onSelect={() => s.setDetailRow(r)}
            onToggle={() => s.toggle(r.id)}
            onApprove={() => s.handleApprove(r.id)}
            onReject={() => s.setRejectTarget(r)}
          />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)] md:block">
        <ScrollableTable minWidth={820}>
          <div className="grid grid-cols-[40px_1fr_140px_170px_80px_100px_90px] items-center border-b border-border bg-[var(--es-neutral-50)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Checkbox checked={s.allVisibleSelected} onCheckedChange={s.toggleAll} aria-label={t.manager.selectAriaAll} />
            <span>{t.manager.employee}</span><span>{t.manager.type}</span><span>{t.manager.dates}</span><span>{t.manager.daysCol}</span><span>{t.manager.submitted}</span><span />
          </div>
          {s.visibleRows.map((r) => (
            <ApprovalRowDesktop
              key={r.id}
              row={r}
              selected={s.selected.has(r.id)}
              exiting={s.exitingIds.has(r.id)}
              onSelect={() => s.setDetailRow(r)}
              onToggle={() => s.toggle(r.id)}
              onApprove={() => s.handleApprove(r.id)}
              onReject={() => s.setRejectTarget(r)}
            />
          ))}
        </ScrollableTable>
      </div>

      <BulkActionBar
        count={s.visibleSelectedIds.length}
        onCancel={() => s.setSelected(new Set())}
        onApproveAll={s.handleBulkApprove}
        onRejectAll={() => s.setBulkRejectOpen(true)}
      />

      <DetailSheet
        row={s.detailRow}
        onClose={() => s.setDetailRow(null)}
        onApprove={s.handleApprove}
        onReject={(id) => s.setRejectTarget(s.rows.find((r) => r.id === id) ?? null)}
      />
      <RejectDialog
        open={!!s.rejectTarget}
        onClose={() => s.setRejectTarget(null)}
        onConfirm={s.handleReject}
        employeeName={s.rejectTarget ? `${s.rejectTarget.employee.firstNameTh} ${s.rejectTarget.employee.lastNameTh}` : undefined}
      />
      <RejectDialog
        open={s.bulkRejectOpen}
        onClose={() => s.setBulkRejectOpen(false)}
        onConfirm={s.handleBulkReject}
        employeeName={t.manager.nRequests.replace("{n}", String(s.visibleSelectedIds.length))}
      />
    </div>
  );
}
