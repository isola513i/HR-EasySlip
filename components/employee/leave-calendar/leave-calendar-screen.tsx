"use client";

import { useMemo, useState } from "react";
import { MobileTopbar } from "@/components/shared/mobile-topbar";
import { useT } from "@/lib/i18n/locale-context";
import { useMyLeaveCalendar } from "@/hooks/use-my-leave-calendar";
import { CalendarGrid } from "./calendar-grid";
import { DayDetail } from "./day-detail";

function pad(n: number) { return n.toString().padStart(2, "0"); }

export function LeaveCalendarScreen() {
  const t = useT();
  const dict = t.myLeaveCalendar;
  const { month, year, setMonth, setYear, requests, holidays, isLoading } = useMyLeaveCalendar();

  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<number | null>(
    today.getMonth() + 1 === month && today.getFullYear() === year ? today.getDate() : null,
  );

  const prev = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1);
    setSelectedDay(null);
  };
  const next = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1);
    setSelectedDay(null);
  };

  const selectedIso = useMemo(() => {
    if (selectedDay === null) return null;
    return `${year}-${pad(month)}-${pad(selectedDay)}`;
  }, [year, month, selectedDay]);

  return (
    <>
      <MobileTopbar title={dict.title} backHref="/employee/leave" />

      <div className="flex flex-col gap-4 p-4">
        <p className="text-[12px] text-muted-foreground">{dict.subtitle}</p>

        <CalendarGrid
          month={month}
          year={year}
          isLoading={isLoading}
          requests={requests}
          holidays={holidays}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onPrev={prev}
          onNext={next}
        />

        <Legend dict={dict} />

        {selectedIso && <DayDetail date={selectedIso} requests={requests} holidays={holidays} />}
      </div>
    </>
  );
}

function Legend({ dict }: { dict: ReturnType<typeof useT>["myLeaveCalendar"] }) {
  const items: { color: string; label: string }[] = [
    { color: "bg-emerald-100 dark:bg-emerald-900/40", label: dict.legendApproved },
    { color: "bg-amber-100 dark:bg-amber-900/40", label: dict.legendPending },
    { color: "bg-rose-100 dark:bg-rose-900/40", label: dict.legendRejected },
    { color: "bg-sky-50 dark:bg-sky-900/40", label: dict.legendHoliday },
  ];
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span aria-hidden className={`inline-block size-3 rounded ${it.color}`} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
