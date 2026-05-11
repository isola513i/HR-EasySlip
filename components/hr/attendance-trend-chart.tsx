"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useT } from "@/lib/i18n/locale-context";

interface DataPoint { date: string; count: number; rate: number }

interface Props { data?: DataPoint[] }

export function AttendanceTrendChart({ data }: Props) {
  const t = useT();

  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-(--es-shadow-sm)">
      <div className="mb-4">
        <div className="text-sm font-semibold">{t.hr.attendanceTrend}</div>
        <div className="text-xs text-muted-foreground">{t.hr.attendanceTrendSub}</div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--es-neutral-200)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            tickFormatter={(v: string) => v.slice(5)}
            stroke="var(--es-neutral-400)"
          />
          <YAxis tick={{ fontSize: 10 }} stroke="var(--es-neutral-400)" />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            labelFormatter={(v) => String(v)}
            formatter={(v) => [String(v), t.hr.dailyRate]}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--es-accent-600)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
