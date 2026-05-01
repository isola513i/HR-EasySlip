"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { useT } from "@/lib/i18n/locale-context";
import type { PdpaOverview } from "@/lib/consent/consent-service";

interface Props {
  totals: PdpaOverview["totals"];
}

const COLORS = {
  consented: "var(--es-success-500)",
  pending: "var(--es-warn-500)",
  partial: "var(--es-error-500)",
  withdrawn: "var(--es-neutral-400)",
} as const;

export function PdpaOverviewChart({ totals }: Props) {
  const t = useT();
  const segments = [
    { key: "consented", label: t.hr.pdpa.overviewLegendConsented, value: totals.consented, color: COLORS.consented },
    { key: "pending", label: t.hr.pdpa.overviewLegendPending, value: totals.pending, color: COLORS.pending },
    { key: "partial", label: t.hr.pdpa.overviewLegendPartial, value: totals.partial, color: COLORS.partial },
    { key: "withdrawn", label: t.hr.pdpa.overviewLegendWithdrawn, value: totals.withdrawn, color: COLORS.withdrawn },
  ].filter((s) => s.value > 0);

  const chartData = segments.length > 0 ? segments : [{ key: "empty", label: "", value: 1, color: "var(--es-neutral-200)" }];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--es-shadow-sm)]">
      <div className="text-base font-semibold">{t.hr.pdpa.overviewTitle}</div>

      <div className="mt-4 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={segments.length > 1 ? 1 : 0}
              stroke="none"
            >
              {chartData.map((s) => <Cell key={s.key} fill={s.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-4 space-y-2 text-[13px]">
        {segments.length === 0 && (
          <li className="text-center text-muted-foreground">{t.common.noData}</li>
        )}
        {segments.map((s) => (
          <li key={s.key} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
            <span className="font-semibold tabular-nums">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
