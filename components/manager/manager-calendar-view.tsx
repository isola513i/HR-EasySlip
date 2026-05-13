"use client";

import { useT } from "@/lib/i18n/locale-context";
import { LeaveMonthCalendar } from "@/components/hr/leave/leave-month-calendar";

export function ManagerCalendarView() {
  const t = useT();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.manager.nav.calendar}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{t.manager.calendarSubtitle}</p>
      </div>

      <LeaveMonthCalendar />
    </div>
  );
}
