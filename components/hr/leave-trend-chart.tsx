"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { useT } from "@/lib/i18n/locale-context";

interface DataPoint { month: string; ANNUAL: number; SICK: number; PERSONAL: number; LWP: number }

interface Props { data?: DataPoint[] }

const COLORS = {
  ANNUAL: "var(--es-accent-600, #2563eb)",
  SICK: "var(--es-error-500, #dc2626)",
  PERSONAL: "var(--es-warn-500, #f59e0b)",
  LWP: "var(--es-neutral-500, #6b7280)",
} as const;

export function LeaveTrendChart({ data }: Props) {
  const t = useT();

  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-[var(--es-shadow-sm)]">
      <div className="mb-4">
        <div className="text-sm font-semibold">{t.hr.leaveTrend}</div>
        <div className="text-xs text-muted-foreground">{t.hr.leaveTrendSub}</div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--es-neutral-200)" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10 }}
            tickFormatter={(v: string) => v.slice(5)}
            stroke="var(--es-neutral-400)"
          />
          <YAxis tick={{ fontSize: 10 }} stroke="var(--es-neutral-400)" allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="ANNUAL" name={t.leave.annual} fill={COLORS.ANNUAL} radius={[2, 2, 0, 0]} />
          <Bar dataKey="SICK" name={t.leave.sick} fill={COLORS.SICK} radius={[2, 2, 0, 0]} />
          <Bar dataKey="PERSONAL" name={t.leave.personal} fill={COLORS.PERSONAL} radius={[2, 2, 0, 0]} />
          <Bar dataKey="LWP" name={t.leave.lwp} fill={COLORS.LWP} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
