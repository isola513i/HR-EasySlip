"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttendanceWeekly } from "@/hooks/use-attendance-weekly";
import { useT } from "@/lib/i18n/locale-context";
import type { WeekdayKey } from "@/lib/attendance/constants";

interface Props { weekStart: string }

const COLORS = {
  present: "var(--es-success-500, #16a34a)",
  late: "var(--es-warn-500, #f59e0b)",
  absent: "var(--es-error-500, #dc2626)",
} as const;

export function WeeklyOverviewChart({ weekStart }: Props) {
  const t = useT();
  const { data, isLoading } = useAttendanceWeekly(weekStart);

  const dayLabel: Record<WeekdayKey, string> = {
    mon: t.hr.attendance.weekdays.mon,
    tue: t.hr.attendance.weekdays.tue,
    wed: t.hr.attendance.weekdays.wed,
    thu: t.hr.attendance.weekdays.thu,
    fri: t.hr.attendance.weekdays.fri,
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--es-shadow-sm)]">
      <div className="mb-4 text-base font-semibold">{t.hr.attendance.weeklyOverview}</div>
      {isLoading ? (
        <Skeleton className="h-[260px] w-full rounded-md" />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} barCategoryGap="22%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--es-neutral-200)" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11 }}
              tickFormatter={(v: string) => dayLabel[v as WeekdayKey] ?? v}
              stroke="var(--es-neutral-400)"
            />
            <YAxis tick={{ fontSize: 10 }} stroke="var(--es-neutral-400)" allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "var(--es-neutral-100)" }}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
              labelFormatter={(label) => dayLabel[label as WeekdayKey] ?? String(label)}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
            <Bar dataKey="present" name={t.hr.attendance.legend.present} fill={COLORS.present} radius={[3, 3, 0, 0]} />
            <Bar dataKey="late" name={t.hr.attendance.legend.late} fill={COLORS.late} radius={[3, 3, 0, 0]} />
            <Bar dataKey="absent" name={t.hr.attendance.legend.absent} fill={COLORS.absent} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
