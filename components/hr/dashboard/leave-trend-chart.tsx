"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaveTrend } from "@/hooks/use-leave-trend";
import { formatMonthShort } from "@/lib/format";
import { useT } from "@/lib/i18n/locale-context";

const SERIES = [
  { key: "ANNUAL", color: "var(--es-accent-600)" },
  { key: "SICK", color: "var(--es-error-500)" },
  { key: "PERSONAL", color: "var(--es-warn-500)" },
  { key: "LWP", color: "var(--es-neutral-500)" },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

export function LeaveTrendChart() {
  const t = useT();
  const { data, isLoading } = useLeaveTrend();
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set());

  const totals = useMemo(() => {
    const sum: Record<SeriesKey, number> = { ANNUAL: 0, SICK: 0, PERSONAL: 0, LWP: 0 };
    for (const d of data) {
      sum.ANNUAL += d.ANNUAL;
      sum.SICK += d.SICK;
      sum.PERSONAL += d.PERSONAL;
      sum.LWP += d.LWP;
    }
    return sum;
  }, [data]);

  const grandTotal = totals.ANNUAL + totals.SICK + totals.PERSONAL + totals.LWP;

  const labels: Record<SeriesKey, string> = {
    ANNUAL: t.leave.annual,
    SICK: t.leave.sick,
    PERSONAL: t.leave.personal,
    LWP: t.leave.lwp,
  };

  const toggle = (k: SeriesKey) =>
    setHidden((p) => {
      const next = new Set(p);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  return (
    <div className="flex h-full min-h-[360px] flex-col rounded-xl border border-border bg-card p-5 shadow-(--es-shadow-sm)">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <div className="text-base font-semibold">{t.hr.dashboard.leaveTrendTitle}</div>
        <div className="text-[11px] text-muted-foreground">
          {t.hr.dashboard.leaveTrendTotal}: <span className="font-semibold tabular-nums text-foreground">{grandTotal}</span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">{t.hr.dashboard.leaveTrendSub}</div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {SERIES.map((s) => {
          const active = !hidden.has(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggle(s.key)}
              className={`group/legend inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                active
                  ? "border-border bg-card text-foreground"
                  : "border-border bg-muted/40 text-muted-foreground line-through"
              }`}
            >
              <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
              {labels[s.key]}
              <span className="tabular-nums text-muted-foreground">{totals[s.key]}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 min-h-0 flex-1">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-md" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--es-neutral-200)" vertical={false} />
              <XAxis dataKey="month" tickFormatter={(v: string) => formatMonthShort(v)} tick={{ fontSize: 11 }} stroke="var(--es-neutral-400)" />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--es-neutral-400)" allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "var(--es-neutral-100)" }}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
                labelFormatter={(label) => formatMonthShort(String(label))}
              />
              <Legend wrapperStyle={{ display: "none" }} />
              {SERIES.filter((s) => !hidden.has(s.key)).map((s) => (
                <Bar key={s.key} dataKey={s.key} stackId="leave" name={labels[s.key]} fill={s.color} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
