"use client";

import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/shared/status-pill";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";

interface CashoutItem {
  id: string;
  year: number;
  unusedDays: string;
  trigger: "YEAR_END" | "RESIGNATION" | "TERMINATION";
  exportStatus: "PENDING" | "EXPORTED";
  exportedAt: string | null;
  computedAt: string;
}

const TRIGGER_KEY = {
  YEAR_END: "yearEnd",
  RESIGNATION: "resignation",
  TERMINATION: "termination",
} as const;

export function CashoutSection() {
  const t = useT();
  const fmt = useFormat();
  const [items, setItems] = useState<CashoutItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<CashoutItem[]>("/api/v1/employee/me/cashout")
      .then(setItems)
      .catch(() => { setError(t.common.loadFailed); setItems([]); });
  }, [t.common.loadFailed]);

  if (items === null) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
      </div>
    );
  }

  if (error) {
    return <div className="px-2 py-4 text-center text-sm text-destructive">{error}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-2 py-8 text-muted-foreground">
        <Coins className="size-8 opacity-40" />
        <p className="text-xs">{t.profile.cashout.empty}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2 p-1">
      {items.map((c) => (
        <li
          key={c.id}
          className="rounded-xl border border-border bg-card p-3 shadow-[var(--es-shadow-xs)]"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold tabular-nums">{c.year}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {t.profile.cashout.triggers[TRIGGER_KEY[c.trigger]]}
              </div>
            </div>
            <StatusPill tone={c.exportStatus === "EXPORTED" ? "success" : "warn"}>
              {c.exportStatus === "EXPORTED" ? t.profile.cashout.exported : t.profile.cashout.pending}
            </StatusPill>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 text-sm">
            <span className="tabular-nums font-bold">{Number(c.unusedDays).toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">{t.profile.cashout.daysLabel}</span>
          </div>
          {c.exportedAt && (
            <div className="mt-1 text-[11px] tabular-nums text-muted-foreground">
              {t.profile.cashout.exportedAt}: {fmt.formatShortDate(c.exportedAt)}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
