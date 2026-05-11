"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/locale-context";

import type { TopOTRow } from "@/lib/overtime/overtime-utils";
export type { TopOTRow };

interface Props {
  rows: TopOTRow[];
  isLoading: boolean;
}

export function TopOtEmployees({ rows, isLoading }: Props) {
  const t = useT();

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
      <div className="border-b border-border px-5 py-4 text-base font-semibold">
        {t.hr.overtime.topTitle}
      </div>

      <div className="flex flex-col gap-2 p-4">
        {isLoading && Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}

        {!isLoading && rows.length === 0 && (
          <div className="px-2 py-8 text-center text-sm text-muted-foreground">
            {t.hr.overtime.topEmpty}
          </div>
        )}

        {!isLoading && rows.map((r, i) => (
          <div key={r.employeeCode} className="flex items-center gap-3 px-1.5 py-1.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--es-accent-600)] text-[12px] font-bold text-white tabular-nums">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{r.name}</div>
              <div className="text-[11px] text-muted-foreground tabular-nums">
                {t.hr.overtime.topRowSubFmt.replace("{hours}", r.hours.toFixed(0))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
