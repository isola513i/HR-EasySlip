"use client";

import { StatCard } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHRDashboard } from "@/hooks/use-hr-dashboard";
import { useT } from "@/lib/i18n/locale-context";
import { AttendanceTrendChart } from "@/components/hr/attendance-trend-chart";
import { LeaveTrendChart } from "@/components/hr/leave-trend-chart";
import { ManpowerBoard } from "@/components/hr/manpower-board";

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

      {/* Manpower (replaces headcount breakdown) */}
      <ManpowerBoard />
    </div>
  );
}
