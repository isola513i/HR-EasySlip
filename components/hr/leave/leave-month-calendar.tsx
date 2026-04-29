"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaveCalendar } from "@/hooks/use-leave-calendar";
import { useT } from "@/lib/i18n/locale-context";

const MONTH_NAMES_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function buildGrid(year: number, month: number): (number | null)[] {
  const first = new Date(year, month - 1, 1);
  const offset = first.getDay();
  const days = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function LeaveMonthCalendar() {
  const t = useT();
  const { entries, isLoading, month, setMonth, year, setYear } = useLeaveCalendar();
  const today = new Date();
  const [todayY, todayM, todayD] = [today.getFullYear(), today.getMonth() + 1, today.getDate()];

  const scheduled = useMemo(() => {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const set = new Set<number>();
    for (const e of entries) {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      const from = start > monthStart ? start : monthStart;
      const to = end < monthEnd ? end : monthEnd;
      const d = new Date(from);
      while (d <= to) {
        set.add(d.getDate());
        d.setDate(d.getDate() + 1);
      }
    }
    return set;
  }, [entries, year, month]);

  const cells = useMemo(() => buildGrid(year, month), [year, month]);

  const prev = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1);
  };
  const next = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1);
  };

  const dowLabels = [t.hr.leave.dow.s, t.hr.leave.dow.m, t.hr.leave.dow.t, t.hr.leave.dow.w, t.hr.leave.dow.th, t.hr.leave.dow.f, t.hr.leave.dow.sa];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--es-shadow-sm)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-base font-semibold">{MONTH_NAMES_EN[month - 1]} {year}</div>
        <div className="flex gap-1">
          <button onClick={prev} aria-label="Previous month" className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={next} aria-label="Next month" className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {dowLabels.map((label, i) => (
          <div key={i} className="py-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
        ))}
        {isLoading
          ? Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-md" />)
          : cells.map((d, i) => {
              if (d === null) return <div key={i} className="h-9" />;
              const isToday = d === todayD && month === todayM && year === todayY;
              const hasLeave = scheduled.has(d);
              return (
                <div
                  key={i}
                  className={`grid h-9 place-items-center rounded-md text-[13px] tabular-nums transition-colors ${
                    hasLeave
                      ? "bg-[var(--es-accent-100)] font-semibold text-[var(--es-accent-700)]"
                      : "text-foreground"
                  } ${isToday ? "ring-1 ring-[var(--es-accent-600)]" : ""}`}
                >
                  {d}
                </div>
              );
            })}
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span aria-hidden="true" className="inline-block size-3 rounded bg-[var(--es-accent-100)]" />
        {t.hr.leave.legendScheduled}
      </div>
    </div>
  );
}
