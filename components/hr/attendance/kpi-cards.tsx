"use client";

import { CheckCircle2, AlertCircle, Clock, AlarmClock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { useAttendanceSummary } from "@/hooks/use-attendance-summary";
import { useT } from "@/lib/i18n/locale-context";

interface Props { date: string }

export function KpiCards({ date }: Props) {
  const t = useT();
  const { data, isLoading } = useAttendanceSummary(date);

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[112px] rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label={t.hr.attendance.presentToday}
        value={String(data.presentToday)}
        tone="success"
        icon={CheckCircle2}
      />
      <StatCard
        label={t.hr.attendance.lateArrivals}
        value={String(data.lateArrivals)}
        tone="warn"
        icon={AlarmClock}
      />
      <StatCard
        label={t.hr.attendance.absentKpi}
        value={String(data.absent)}
        tone="error"
        icon={AlertCircle}
      />
      <StatCard
        label={t.hr.attendance.avgHours}
        value={`${data.avgHours.toFixed(1)}h`}
        tone="info"
        icon={Clock}
      />
    </div>
  );
}
