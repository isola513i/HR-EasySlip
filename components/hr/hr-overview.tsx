"use client";

import { StatCard } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHRDashboard } from "@/hooks/use-hr-dashboard";
import { useT } from "@/lib/i18n/locale-context";
import { AttendanceTrendChart } from "@/components/hr/attendance-trend-chart";
import { LeaveTrendChart } from "@/components/hr/leave-trend-chart";

export function HROverview() {
  const { data, isLoading, error } = useHRDashboard();
  const t = useT();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
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
    { label: t.hr.activeEmployees, value: String(data.totalActive), sub: t.hr.statusCount.replace("{count}", String(data.headcount.length)), tone: "success" as const },
    { label: t.hr.pendingLeaves, value: String(data.pendingLeaves), sub: t.hr.awaitingApproval, tone: "warn" as const },
    { label: t.hr.todayAttendance, value: String(data.todayAttendance), sub: t.hr.clockedInToday, tone: "accent" as const },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3.5">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Trend charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <AttendanceTrendChart data={data.attendanceTrend} />
        <LeaveTrendChart data={data.leaveTrend} />
      </div>

      {/* Headcount breakdown */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--es-shadow-sm)]">
        <div className="mb-3 text-[15px] font-semibold">{t.hr.headcount}</div>
        {data.headcount.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">{t.hr.noEmployeeData}</div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 lg:grid-cols-4">
            {data.headcount.map((h) => {
              const pct = data.totalActive > 0 ? Math.round((h.count / data.totalActive) * 100) : 0;
              return (
                <div key={h.status}>
                  <div className="mb-[3px] flex justify-between text-xs">
                    <span>{h.status}</span>
                    <span className="tabular-nums text-muted-foreground">{h.count} · {pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--es-neutral-100)]">
                    <div className="h-full rounded-full bg-[var(--es-accent-500)]" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
