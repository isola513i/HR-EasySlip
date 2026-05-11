"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";

import type { TrendPoint } from "@/lib/overtime/overtime-utils";
export type { TrendPoint };

interface Props {
  data: TrendPoint[];
  isLoading: boolean;
}

export function MonthlyTrendsChart({ data, isLoading }: Props) {
  const t = useT();
  const fmt = useFormat();
  const u = t.hr.overtime.hoursUnit;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-(--es-shadow-sm)">
      <div className="mb-4 text-base font-semibold">{t.hr.overtime.trendsTitle}</div>
      {isLoading ? (
        <Skeleton className="h-[280px] w-full rounded-md" />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--es-neutral-200)" vertical={false} />
            <XAxis
              dataKey="monthKey"
              tick={{ fontSize: 11 }}
              tickFormatter={(v: string) => fmt.formatMonthShort(v)}
              stroke="var(--es-neutral-400)"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              stroke="var(--es-neutral-400)"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--es-neutral-100)" }}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
              labelFormatter={(label) => fmt.formatMonthShort(String(label))}
              formatter={(value) => [`${Number(value).toFixed(0)}${u}`, t.hr.overtime.kpiTotalHours]}
            />
            <Bar dataKey="hours" fill="var(--es-accent-500)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
