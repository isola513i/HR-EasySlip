import { StatCard } from "@/components/shared/stat-card";

const stats = [
  { label: "Headcount", value: "247", sub: "+3 this month", tone: "success" as const },
  { label: "On leave today", value: "12", sub: "4.9% of workforce", tone: "info" as const },
  { label: "Pending approvals", value: "38", sub: "across 6 managers", tone: "warn" as const },
  { label: "Late today", value: "7", sub: "1.2x 30-day avg", tone: "error" as const },
];

const chartData = [
  { month: "Nov", annual: 52, sick: 21, personal: 8 },
  { month: "Dec", annual: 71, sick: 18, personal: 11 },
  { month: "Jan", annual: 34, sick: 42, personal: 6 },
  { month: "Feb", annual: 45, sick: 27, personal: 9 },
  { month: "Mar", annual: 60, sick: 22, personal: 14 },
  { month: "Apr", annual: 68, sick: 19, personal: 12 },
];

const topReasons = [
  { label: "Sick — common cold", count: 38, pct: 36 },
  { label: "Annual — vacation", count: 31, pct: 29 },
  { label: "Personal — family", count: 17, pct: 16 },
  { label: "Sick — medical appt.", count: 12, pct: 11 },
  { label: "Other", count: 8, pct: 8 },
];

export function HROverview() {
  return (
    <div className="flex flex-col gap-5">
      {/* Metric tiles */}
      <div className="grid grid-cols-4 gap-3.5">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-[2fr_1fr] gap-5">
        {/* Leave utilization chart */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--es-shadow-sm)]">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <div className="text-[15px] font-semibold">Leave utilization · last 6 months</div>
              <div className="text-xs text-muted-foreground">Days used ÷ total days available</div>
            </div>
            <div className="flex gap-3.5 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-sm bg-[var(--es-accent-600)]" />Annual
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-sm bg-[var(--es-warn-500)]" />Sick
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-sm bg-[var(--es-info-500)]" />Personal
              </span>
            </div>
          </div>
          <div className="flex items-end gap-[18px] border-b border-border px-2.5" style={{ height: 200 }}>
            {chartData.map((b) => (
              <div key={b.month} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex items-end gap-[3px]" style={{ height: 160 }}>
                  <div className="w-3 rounded-t-sm bg-[var(--es-accent-600)]" style={{ height: b.annual * 1.6 }} />
                  <div className="w-3 rounded-t-sm bg-[var(--es-warn-500)]" style={{ height: b.sick * 1.6 }} />
                  <div className="w-3 rounded-t-sm bg-[var(--es-info-500)]" style={{ height: b.personal * 1.6 }} />
                </div>
                <div className="text-[11px] text-muted-foreground">{b.month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top reasons */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--es-shadow-sm)]">
          <div className="mb-3 text-[15px] font-semibold">Top reasons (30d)</div>
          {topReasons.map((r) => (
            <div key={r.label} className="mb-2.5">
              <div className="mb-[3px] flex justify-between text-xs">
                <span>{r.label}</span>
                <span className="tabular-nums text-muted-foreground">{r.count} · {r.pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--es-neutral-100)]">
                <div className="h-full rounded-full bg-[var(--es-accent-500)]" style={{ width: `${r.pct * 2.5}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
