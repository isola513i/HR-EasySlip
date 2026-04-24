"use client";

import { StatCard } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHRDashboard } from "@/hooks/use-hr-dashboard";

export function HROverview() {
  const { data, isLoading, error } = useHRDashboard();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-[2fr_1fr] gap-5">
          <Skeleton className="h-[260px] rounded-xl" />
          <Skeleton className="h-[260px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="py-16 text-center text-[var(--es-error-500)]">{error}</div>;
  }
  if (!data) return null;

  const stats = [
    { label: "Active Employees", value: String(data.totalActive), sub: `${data.headcount.length} statuses`, tone: "success" as const },
    { label: "Pending Leaves", value: String(data.pendingLeaves), sub: "awaiting approval", tone: "warn" as const },
    { label: "Today Attendance", value: String(data.todayAttendance), sub: "clocked in today", tone: "accent" as const },
  ];

  const leaveTypeColors: Record<string, string> = {
    ANNUAL: "var(--es-accent-600)", SICK: "var(--es-warn-500)", PERSONAL: "var(--es-info-500)",
  };
  const leaveEntries = data.leavesByType.map((l) => ({
    type: l.type, count: l.count,
    color: leaveTypeColors[l.type] ?? "var(--es-neutral-400)",
  }));
  const maxCount = Math.max(...leaveEntries.map((e) => e.count), 1);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-3.5">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>
      <div className="grid grid-cols-[2fr_1fr] gap-5">
        {/* Leave by type chart */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--es-shadow-sm)]">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <div className="text-[15px] font-semibold">Leave by type · last 6 months</div>
              <div className="text-xs text-muted-foreground">Approved + pending requests</div>
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
          {leaveEntries.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No leave data available</div>
          ) : (
            <div className="flex items-end gap-[18px] border-b border-border px-2.5" style={{ height: 200 }}>
              {leaveEntries.map((entry) => (
                <div key={entry.type} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex items-end gap-[3px]" style={{ height: 160 }}>
                    <div className="w-6 rounded-t-sm" style={{ height: (entry.count / maxCount) * 150, backgroundColor: entry.color }} />
                  </div>
                  <div className="text-[11px] text-muted-foreground">{entry.type} ({entry.count})</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Headcount breakdown */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--es-shadow-sm)]">
          <div className="mb-3 text-[15px] font-semibold">Headcount breakdown</div>
          {data.headcount.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No employee data</div>
          ) : (
            data.headcount.map((h) => {
              const pct = data.totalActive > 0 ? Math.round((h.count / data.totalActive) * 100) : 0;
              return (
                <div key={h.status} className="mb-2.5">
                  <div className="mb-[3px] flex justify-between text-xs">
                    <span>{h.status}</span>
                    <span className="tabular-nums text-muted-foreground">{h.count} · {pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--es-neutral-100)]">
                    <div className="h-full rounded-full bg-[var(--es-accent-500)]" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
