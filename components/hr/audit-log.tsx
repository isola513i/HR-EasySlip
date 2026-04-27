"use client";

import { CalendarDays, Filter, Download, ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import { StatusPill } from "@/components/shared/status-pill";
import { SearchInput } from "@/components/shared/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { formatTime } from "@/lib/format";
import { useT } from "@/lib/i18n/locale-context";

export function AuditLog() {
  const t = useT();
  const { logs, page, setPage, totalPages, search, setSearch, isLoading, error } =
    useAuditLogs();

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2.5">
        <SearchInput
          placeholder={t.hr.auditSearch}
          className="max-w-[360px]"
          value={search}
          onChange={setSearch}
        />
        <button className="flex items-center gap-1.5 rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-[7px] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
          <CalendarDays className="size-3.5" /> {t.hr.auditToday}
        </button>
        <button className="flex items-center gap-1.5 rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-[7px] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
          <Filter className="size-3.5" /> {t.hr.auditActorRole}
        </button>
        <div className="flex-1" />
        <button className="flex items-center gap-1.5 rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-[7px] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
          <Download className="size-3.5" /> {t.common.export}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
        <div className="grid grid-cols-[80px_1fr_180px_1.2fr_120px_70px] border-b border-border bg-[var(--es-neutral-50)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span>{t.hr.auditTime}</span>
          <span>{t.hr.auditActor}</span>
          <span>{t.hr.auditAction}</span>
          <span>{t.hr.auditTarget}</span>
          <span>{t.hr.auditIP}</span>
          <span>{t.hr.auditStatus}</span>
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
            <p className="text-sm">{t.hr.noAuditLogs}</p>
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
              <span className="truncate font-mono text-xs text-muted-foreground" title={`${r.entityType}#${r.entityId}`}>
                {r.entityType}#{r.entityId.slice(0, 8)}
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
            <ChevronLeft className="size-3.5" /> {t.common.prev}
          </button>
          <span className="text-xs tabular-nums text-muted-foreground">
            {t.common.page} {page} {t.common.of} {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="flex items-center gap-1 rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-[7px] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
          >
            {t.common.next} <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
