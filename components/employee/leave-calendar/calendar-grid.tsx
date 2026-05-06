"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/locale-context";
import { isoDateKey, monthBounds, shiftIsoDays } from "@/lib/datetime/bangkok";
import type { MyLeaveRequest, PublicHoliday } from "@/hooks/use-my-leave-calendar";

interface DayState {
  status: "PENDING" | "APPROVED" | "REJECTED" | null;
  isHoliday: boolean;
}

interface Props {
  month: number;
  year: number;
  isLoading: boolean;
  requests: MyLeaveRequest[];
  holidays: PublicHoliday[];
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

function buildGrid(year: number, month: number): (number | null)[] {
  const first = new Date(year, month - 1, 1);
  const offset = first.getDay();
  const days = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function statusPriority(s: MyLeaveRequest["status"]): "APPROVED" | "PENDING" | "REJECTED" | null {
  if (s === "APPROVED") return "APPROVED";
  if (s === "PENDING") return "PENDING";
  if (s === "REJECTED") return "REJECTED";
  return null;
}

function buildDayMap(year: number, month: number, requests: MyLeaveRequest[], holidays: PublicHoliday[]) {
  // Compare by YYYY-MM-DD keys instead of Date instants. Date arithmetic
  // would shift end-of-month entries out of range when Prisma `@db.Date`
  // values arrive as UTC midnight ISO strings while monthEnd is local
  // midnight on a UTC+7 browser.
  const map = new Map<number, DayState>();
  const { startKey, endKey } = monthBounds(year, month);

  for (const h of holidays) {
    const key = isoDateKey(h.date);
    if (key >= startKey && key <= endKey) {
      const day = parseInt(key.slice(8, 10), 10);
      const cur = map.get(day) ?? { status: null, isHoliday: false };
      cur.isHoliday = true;
      map.set(day, cur);
    }
  }

  // Process APPROVED first so PENDING/REJECTED don't downgrade an already-approved day.
  const ordered = [...requests].sort((a, b) => {
    const order = { APPROVED: 0, PENDING: 1, REJECTED: 2, CANCELLED: 3, WITHDRAWN: 3 } as const;
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  for (const r of ordered) {
    const status = statusPriority(r.status);
    if (!status) continue;
    const startKeyR = isoDateKey(r.startDate);
    const endKeyR = isoDateKey(r.endDate);
    let cur = startKeyR > startKey ? startKeyR : startKey;
    const stop = endKeyR < endKey ? endKeyR : endKey;
    while (cur <= stop) {
      const day = parseInt(cur.slice(8, 10), 10);
      const existing = map.get(day) ?? { status: null, isHoliday: false };
      if (
        existing.status === null
        || existing.status === "REJECTED"
        || (existing.status === "PENDING" && status === "APPROVED")
      ) {
        existing.status = status;
      }
      map.set(day, existing);
      cur = shiftIsoDays(cur, 1);
    }
  }
  return map;
}

function dayClassName(state: DayState | undefined, isToday: boolean, isSelected: boolean) {
  const base = "grid h-11 cursor-pointer place-items-center rounded-md text-[13px] tabular-nums transition-colors";
  let color = "text-foreground hover:bg-muted";
  if (state?.status === "APPROVED") color = "bg-emerald-100 font-semibold text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300";
  else if (state?.status === "PENDING") color = "bg-amber-100 font-semibold text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300";
  else if (state?.status === "REJECTED") color = "bg-rose-100 font-medium text-rose-700 line-through hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-300";
  else if (state?.isHoliday) color = "bg-sky-50 font-medium text-sky-700 hover:bg-sky-100 dark:bg-sky-900/40 dark:text-sky-300";
  const ring = isSelected
    ? " ring-2 ring-[var(--es-accent-600)] ring-offset-1 ring-offset-card"
    : isToday
      ? " ring-1 ring-[var(--es-accent-600)]"
      : "";
  return `${base} ${color}${ring}`;
}

export function CalendarGrid({ month, year, isLoading, requests, holidays, selectedDay, onSelectDay, onPrev, onNext }: Props) {
  const t = useT();
  const today = new Date();
  const [todayY, todayM, todayD] = [today.getFullYear(), today.getMonth() + 1, today.getDate()];

  const cells = useMemo(() => buildGrid(year, month), [year, month]);
  const dayMap = useMemo(() => buildDayMap(year, month, requests, holidays), [year, month, requests, holidays]);
  const dowLabels = [t.hr.leave.dow.s, t.hr.leave.dow.m, t.hr.leave.dow.t, t.hr.leave.dow.w, t.hr.leave.dow.th, t.hr.leave.dow.f, t.hr.leave.dow.sa];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-base font-semibold">{t.common.monthsLong[month - 1]} {year}</div>
        <div className="flex gap-1">
          <button onClick={onPrev} aria-label={t.common.prevMonth} className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={onNext} aria-label={t.common.nextMonth} className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {dowLabels.map((label, i) => (
          <div key={i} className="py-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
        ))}
        {isLoading
          ? Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-md" />)
          : cells.map((d, i) => {
              if (d === null) return <div key={i} className="h-11" />;
              const isToday = d === todayD && month === todayM && year === todayY;
              const isSelected = selectedDay === d;
              const state = dayMap.get(d);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelectDay(d)}
                  className={dayClassName(state, isToday, isSelected)}
                  aria-pressed={isSelected}
                >
                  {d}
                </button>
              );
            })}
      </div>
    </div>
  );
}
