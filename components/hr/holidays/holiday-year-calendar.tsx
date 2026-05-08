"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";
import type { Holiday } from "@/hooks/use-holidays";

interface Props {
  year: number;
  holidays: Holiday[];
  onSelectDate?: (iso: string) => void;
}

const MONTH_LOCALE_OPTIONS: Intl.DateTimeFormatOptions = { month: "short" };
const WEEKDAY_LOCALE_OPTIONS: Intl.DateTimeFormatOptions = { weekday: "narrow" };

function* monthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startWeekday = first.getDay(); // 0=Sun
  for (let i = 0; i < startWeekday; i++) yield null;
  for (let d = 1; d <= last.getDate(); d++) yield d;
}

function isoFor(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function HolidayYearCalendar({ year, holidays, onSelectDate }: Props) {
  const { locale } = useLocale();
  const localeTag = locale === "th" ? "th-TH" : "en-GB";

  const holidaySet = useMemo(() => {
    const m = new Map<string, Holiday>();
    for (const h of holidays) m.set(h.date.slice(0, 10), h);
    return m;
  }, [holidays]);

  const monthLabels = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        new Date(year, i, 1).toLocaleDateString(localeTag, MONTH_LOCALE_OPTIONS),
      ),
    [year, localeTag],
  );

  const weekdayLabels = useMemo(() => {
    const labels: string[] = [];
    // 2024-01-07 is a Sunday
    for (let i = 0; i < 7; i++) {
      labels.push(
        new Date(2024, 0, 7 + i).toLocaleDateString(localeTag, WEEKDAY_LOCALE_OPTIONS),
      );
    }
    return labels;
  }, [localeTag]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 12 }, (_, m) => (
        <div
          key={m}
          className="rounded-2xl bg-card p-4 ring-1 ring-[var(--border-subtle)] shadow-[var(--es-shadow-xs)]"
        >
          <div className="mb-2.5 text-center text-[12px] font-semibold tracking-wide text-foreground">
            {monthLabels[m]}
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center text-[10px] font-medium text-muted-foreground/70">
            {weekdayLabels.map((label, i) => (
              <div key={i} className="select-none">{label}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-y-0.5 text-center text-[11.5px] tabular-nums">
            {Array.from(monthDays(year, m), (d, i) => {
              if (d === null) return <div key={`b-${i}`} aria-hidden="true" />;
              const iso = isoFor(year, m, d);
              const holiday = holidaySet.get(iso);
              const isHoliday = !!holiday;
              const Component = onSelectDate && isHoliday ? "button" : "div";
              return (
                <Component
                  key={i}
                  type={Component === "button" ? "button" : undefined}
                  onClick={Component === "button" ? () => onSelectDate?.(iso) : undefined}
                  title={isHoliday ? holiday.name : undefined}
                  className={cn(
                    "mx-auto grid size-6 place-items-center rounded-full transition-colors",
                    isHoliday
                      ? "bg-[var(--es-accent-600)] font-semibold text-white shadow-[var(--es-shadow-xs)] hover:bg-[var(--es-accent-700)]"
                      : "text-foreground/80",
                  )}
                >
                  {d}
                </Component>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
