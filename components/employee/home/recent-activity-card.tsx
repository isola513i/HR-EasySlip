"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { useLocale } from "@/hooks/use-locale";
import { formatDate } from "@/lib/format";
import { getActionLabel } from "@/lib/audit/action-labels";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface AuditEntry {
  action: string;
  createdAt: string;
  entityType: string;
}

interface RecentActivityCardProps {
  dict: Dictionary;
}

export function RecentActivityCard({ dict }: RecentActivityCardProps) {
  const [items, setItems] = useState<AuditEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { locale } = useLocale();

  useEffect(() => {
    const ctrl = new AbortController();
    apiFetch<AuditEntry[]>("/api/v1/employee/me/activity?perPage=5", { signal: ctrl.signal })
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setItems(data);
        setLoading(false);
      })
      .catch((err) => {
        if (ctrl.signal.aborted || (err as { name?: string })?.name === "AbortError") return;
        setItems([]);
        setLoading(false);
      });
    return () => ctrl.abort();
  }, []);

  return (
    <div>
      <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {dict.employee.recent}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`flex items-center justify-between px-4 py-3 ${i < 2 ? "border-b border-[var(--es-neutral-100)]" : ""}`}>
              <div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1 h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          ))
        ) : items && items.length > 0 ? (
          items.map((r, i) => (
            <div
              key={`${r.createdAt}-${i}`}
              className={`flex items-center justify-between px-4 py-3 ${i < items.length - 1 ? "border-b border-[var(--es-neutral-100)]" : ""}`}
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium">{getActionLabel(r.action, locale)}</div>
                <div className="text-[11px] text-muted-foreground">{formatDate(r.createdAt)}</div>
              </div>
              <span className="ml-2 shrink-0 text-[11px] text-muted-foreground">{r.entityType}</span>
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">{dict.employee.noRecentActivity}</div>
        )}
      </div>
    </div>
  );
}
