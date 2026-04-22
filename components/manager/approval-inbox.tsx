"use client";

import { useState, useCallback } from "react";
import { Filter, Check, X } from "lucide-react";
import { StatusPill } from "@/components/shared/status-pill";
import { SearchInput } from "@/components/shared/search-input";
import { cn } from "@/lib/utils";
import { DetailSheet } from "@/components/manager/detail-sheet";
import type { ApprovalRow } from "@/types/manager";

const rows: ApprovalRow[] = [
  { id: 1, name: "Suda Thongdee", code: "ES0042", type: "Sick", days: "2.0", dates: "Apr 22–23", reason: "Medical appointment", submitted: "2h ago", hasPdf: true },
  { id: 2, name: "Nattapol Kaewcharoen", code: "ES0018", type: "Annual", days: "3.0", dates: "Apr 28–30", reason: "Family trip", submitted: "4h ago", hasPdf: false },
  { id: 3, name: "Piyanuch Seedum", code: "ES0031", type: "Personal", days: "0.5", dates: "Apr 24 (afternoon)", reason: "Family matter", submitted: "6h ago", hasPdf: false },
  { id: 4, name: "Anon Chokdee", code: "ES0027", type: "Overtime", days: "3.0 hrs", dates: "Apr 26 · 1.5x", reason: "Sprint release", submitted: "Today", hasPdf: false },
  { id: 5, name: "Malee Suayngam", code: "ES0055", type: "Sick", days: "1.0", dates: "Apr 25", reason: "Cold", submitted: "1d ago", hasPdf: true },
];

const filters = ["All (5)", "Leave (4)", "Overtime (1)", "Correction (0)"];

export function ApprovalInbox() {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [detailRow, setDetailRow] = useState<ApprovalRow | null>(null);
  const [activeFilter, setActiveFilter] = useState(0);

  const toggle = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)),
    );
  }, []);

  const stopPropagation = useCallback(
    (e: React.MouseEvent) => e.stopPropagation(),
    [],
  );

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-2.5">
        <SearchInput placeholder="Search name or employee ID..." />
        {filters.map((f, i) => (
          <button
            key={f}
            onClick={() => setActiveFilter(i)}
            className={cn(
              "rounded-md border px-3 py-[7px] text-xs font-medium transition-colors",
              i === activeFilter
                ? "border-transparent bg-[var(--es-neutral-900)] text-white"
                : "border-[var(--es-neutral-300)] bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {f}
          </button>
        ))}
        <button className="flex items-center gap-1.5 rounded-md border border-[var(--es-neutral-300)] bg-card px-3 py-[7px] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
          <Filter className="size-3.5" /> More filters
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
        <div className="grid grid-cols-[40px_1fr_180px_170px_100px_120px_90px] items-center border-b border-border bg-[var(--es-neutral-50)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <input
            type="checkbox"
            checked={selected.size === rows.length}
            onChange={toggleAll}
            className="size-4 accent-[var(--es-accent-600)]"
            aria-label="Select all"
          />
          <span>Employee</span>
          <span>Type</span>
          <span>Dates</span>
          <span>Days</span>
          <span>Submitted</span>
          <span />
        </div>

        {rows.map((r) => {
          const sel = selected.has(r.id);
          return (
            <div
              key={r.id}
              onClick={() => setDetailRow(r)}
              className={cn(
                "grid cursor-pointer grid-cols-[40px_1fr_180px_170px_100px_120px_90px] items-center border-b border-[var(--es-neutral-100)] px-4 py-3.5 text-[13px] transition-colors hover:bg-muted/50",
                sel && "bg-[var(--es-accent-50)]",
              )}
            >
              <input
                type="checkbox"
                checked={sel}
                onClick={stopPropagation}
                onChange={() => toggle(r.id)}
                className="size-4 accent-[var(--es-accent-600)]"
                aria-label={`Select ${r.name}`}
              />
              <div>
                <div className="font-semibold">{r.name}</div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {r.code}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span>{r.type}</span>
                {r.hasPdf && (
                  <StatusPill tone="info" dot={false}>
                    PDF
                  </StatusPill>
                )}
              </div>
              <div>
                <div>{r.dates}</div>
                <div className="text-[11px] text-muted-foreground">
                  {r.reason}
                </div>
              </div>
              <div className="tabular-nums font-semibold">{r.days}</div>
              <div className="text-xs text-muted-foreground">
                {r.submitted}
              </div>
              <div className="flex justify-end gap-0.5">
                <button
                  title="Approve"
                  aria-label={`Approve ${r.name}`}
                  onClick={stopPropagation}
                  className="rounded-md p-1.5 text-[var(--es-success-600)] transition-colors hover:bg-[var(--es-success-50)]"
                >
                  <Check className="size-4" />
                </button>
                <button
                  title="Reject"
                  aria-label={`Reject ${r.name}`}
                  onClick={stopPropagation}
                  className="rounded-md p-1.5 text-[var(--es-error-500)] transition-colors hover:bg-[var(--es-error-50)]"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-30 mx-auto w-fit">
          <div className="flex items-center gap-3 rounded-[10px] border border-border bg-card px-3 py-2.5 shadow-[0_10px_40px_-10px_rgba(16,24,40,0.25),0_2px_6px_rgba(16,24,40,0.08)]">
            <div className="text-[13px]">
              <b className="tabular-nums font-semibold">{selected.size}</b>
              <span className="text-muted-foreground"> selected</span>
            </div>
            <div className="h-5 w-px bg-border" />
            <button
              onClick={() => setSelected(new Set())}
              className="rounded-md border border-[var(--es-neutral-300)] bg-card px-3 py-[7px] text-[13px] font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button className="flex items-center gap-1.5 rounded-md border border-[var(--es-error-500)] bg-card px-3 py-[7px] text-[13px] font-semibold text-[var(--es-error-500)] transition-colors hover:bg-[var(--es-error-50)]">
              <X className="size-3.5" /> Reject all
            </button>
            <button className="flex items-center gap-1.5 rounded-md bg-[var(--es-accent-600)] px-3.5 py-[7px] text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(61,70,204,0.2)] transition-colors hover:bg-[var(--es-accent-700)]">
              <Check className="size-3.5" /> Approve all
            </button>
          </div>
        </div>
      )}

      <DetailSheet row={detailRow} onClose={() => setDetailRow(null)} />
    </div>
  );
}
