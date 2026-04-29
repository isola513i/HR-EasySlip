"use client";

import { useEffect, useState } from "react";
import { KpiGrid } from "@/components/hr/dashboard/kpi-grid";
import { LeaveTrendChart } from "@/components/hr/dashboard/leave-trend-chart";
import { QuickActions } from "@/components/hr/dashboard/quick-actions";
import { RecentActivities } from "@/components/hr/dashboard/recent-activities";
import { UpcomingEvents } from "@/components/hr/dashboard/upcoming-events";
import { useT } from "@/lib/i18n/locale-context";

interface Props { firstName?: string }

export function DashboardScreen({ firstName = "" }: Props) {
  const t = useT();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => { setNow(new Date()); }, []);

  const greeting = now ? greetingFor(now.getHours(), t) : "";
  const personalGreeting = firstName
    ? `${greeting}, ${firstName}. ${t.hr.dashboard.todayMessage}`
    : `${greeting}. ${t.hr.dashboard.todayMessage}`;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.hr.dashboard.title}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{personalGreeting}</p>
      </div>

      <KpiGrid />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <LeaveTrendChart />
        <QuickActions />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <RecentActivities />
        <UpcomingEvents />
      </div>
    </div>
  );
}

function greetingFor(hour: number, t: ReturnType<typeof useT>): string {
  if (hour < 12) return t.hr.dashboard.greetingMorning;
  if (hour < 18) return t.hr.dashboard.greetingAfternoon;
  return t.hr.dashboard.greetingEvening;
}
