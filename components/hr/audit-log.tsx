"use client";

import { CalendarDays, Filter, Download, ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import { StatusPill } from "@/components/shared/status-pill";
import { SearchInput } from "@/components/shared/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { formatTime } from "@/lib/format";

export function AuditLog() {
  const { logs, page, setPage, totalPages, search, setSearch, isLoading, error } =
    useAuditLogs();

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2.5">
        <SearchInput
          placeholder="Search action, actor, target..."
          className="max-w-[360px]"
          value={search}
          onChange={setSearch}
        />
        <button className="flex items-center gap-1.5 rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-[7px] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
          <CalendarDays className="size-3.5" /> Today
        </button>
        <button className="flex items-center gap-1.5 rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-[7px] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
          <Filter className="size-3.5" /> Actor role
        </button>
        <div className="flex-1" />
        <button className="flex items-center gap-1.5 rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-[7px] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
          <Download className="size-3.5" /> Export
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
        <div className="grid grid-cols-[80px_1fr_180px_1.2fr_120px_70px] border-b border-border bg-[var(--es-neutral-50)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span>Time</span>
          <span>Actor</span>
          <span>Action</span>
          <span>Target</span>
          <span>IP</span>
          <span>Status</span>
        </div>

        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[80px_1fr_180px_1.2fr_120px_70px] items-center border-t border-[var(--es-neutral-100)] px-4 py-3"
            >
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}

        {!isLoading && error && (
          <div className="px-4 py-8 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {!isLoading && !error && logs.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <ScrollText className="size-10 opacity-40" />
            <p className="text-sm">ไม่มี log กิจกรรม</p>
          </div>
        )}

        {!isLoading &&
          !error &&
          logs.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[80px_1fr_180px_1.2fr_120px_70px] items-center border-t border-[var(--es-neutral-100)] px-4 py-3 text-[13px]"
            >
              <span className="tabular-nums text-muted-foreground">
                {formatTime(r.createdAt)}
              </span>
              <span>{r.actor?.email ?? r.actorId}</span>
              <code className="rounded bg-[var(--es-accent-50)] px-[7px] py-[2px] font-mono text-xs text-[var(--es-accent-700)]">
                {r.action}
              </code>
              <span className="font-mono text-xs text-muted-foreground">
                {r.entityType}#{r.entityId}
              </span>
              <span className="tabular-nums text-xs text-muted-foreground">
                {r.ipAddress ?? "—"}
              </span>
              <StatusPill tone="success">OK</StatusPill>
            </div>
          ))}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="flex items-center gap-1 rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-[7px] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft className="size-3.5" /> Prev
          </button>
          <span className="text-xs tabular-nums text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="flex items-center gap-1 rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-[7px] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
          >
            Next <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
