"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";

interface AuditEntry {
  id: string;
  action: string;
  createdAt: string;
  actor: { id: string; email: string } | null;
  before: { value?: unknown } | null;
  after: { value?: unknown } | null;
}

interface PaginatedResponse {
  data: AuditEntry[];
  pagination?: { total: number };
}

interface Props {
  settingKey: string | null;
  onClose: () => void;
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

export function SettingHistoryDialog({ settingKey, onClose }: Props) {
  const t = useT();
  const fmt = useFormat();
  const dict = t.hr.settings;
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const open = settingKey !== null;

  useEffect(() => {
    if (!settingKey) return;
    let cancelled = false;
    setLoading(true);
    setEntries(null);

    apiFetch<AuditEntry[] | PaginatedResponse>(
      `/api/v1/audit/logs/SystemConfig/${encodeURIComponent(settingKey)}?perPage=50`,
    )
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : res.data ?? [];
        // Show newest first
        setEntries([...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
      })
      .catch(() => { if (!cancelled) setEntries([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [settingKey]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <History className="size-4" />
            {dict.historyTitle}
          </DialogTitle>
          {settingKey && (
            <code className="block truncate text-[11px] text-muted-foreground">{settingKey}</code>
          )}
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pt-1">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-md" />
              ))}
            </div>
          ) : !entries || entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{dict.historyEmpty}</p>
          ) : (
            <ol className="space-y-2">
              {entries.map((e) => {
                const fromValue = formatValue(e.before?.value);
                const toValue = formatValue(e.after?.value);
                return (
                  <li key={e.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-baseline justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>{fmt.formatDateTime(e.createdAt)}</span>
                      <span className="truncate">
                        {dict.historyChangedBy}: {e.actor?.email ?? "—"}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-[12px]">
                      <span className="text-muted-foreground">{dict.historyValueFrom}</span>
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{fromValue}</code>
                      <span className="text-muted-foreground">→ {dict.historyValueTo}</span>
                      <code className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {toValue}
                      </code>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
