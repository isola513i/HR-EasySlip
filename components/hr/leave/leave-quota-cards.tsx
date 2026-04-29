"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/locale-context";
import type { LeaveTypeStats } from "@/lib/leave/leave-org-stats-service";

interface Props {
  stats: LeaveTypeStats[];
  isLoading: boolean;
}

const TYPE_TONE: Record<string, { bar: string; bg: string }> = {
  ANNUAL: { bar: "bg-[var(--es-accent-600)]", bg: "bg-[var(--es-accent-100)]" },
  SICK: { bar: "bg-[var(--es-error-500)]", bg: "bg-[var(--es-error-50)]" },
  PERSONAL: { bar: "bg-[var(--es-warn-500)]", bg: "bg-[var(--es-warn-50)]" },
};

function Card({ stats }: { stats: LeaveTypeStats }) {
  const t = useT();
  const tone = TYPE_TONE[stats.type] ?? TYPE_TONE.ANNUAL;
  const totalUsed = stats.used + stats.pending;
  const percent = stats.allocated > 0 ? Math.min(100, (totalUsed / stats.allocated) * 100) : 0;
  const label = t.leave[stats.type.toLowerCase() as "annual" | "sick" | "personal"];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--es-shadow-sm)]">
      <div className="text-base font-semibold">{label}</div>
      <div className="mt-4 space-y-1.5">
        <div className="flex items-baseline justify-between text-[13px]">
          <span className="text-muted-foreground">{t.hr.leave.used}</span>
          <span className="tabular-nums font-semibold">{stats.used.toFixed(0)} {t.hr.leave.daysUnit}</span>
        </div>
        <div className="flex items-baseline justify-between text-[13px]">
          <span className="text-muted-foreground">{t.hr.leave.available}</span>
          <span className="tabular-nums font-semibold">{stats.available.toFixed(0)} {t.hr.leave.daysUnit}</span>
        </div>
      </div>
      <div className={`mt-3 h-1.5 w-full rounded-full ${tone.bg}`}>
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${tone.bar}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function LeaveQuotaCards({ stats, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[148px] rounded-xl" />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((s) => <Card key={s.type} stats={s} />)}
    </div>
  );
}
