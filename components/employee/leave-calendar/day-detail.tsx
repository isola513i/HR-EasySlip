"use client";

import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/locale-context";
import { useLocale } from "@/hooks/use-locale";
import { useFormat } from "@/hooks/use-format";
import type { MyLeaveRequest, PublicHoliday } from "@/hooks/use-my-leave-calendar";

interface Props {
  date: string; // YYYY-MM-DD
  requests: MyLeaveRequest[];
  holidays: PublicHoliday[];
}

function statusVariant(status: MyLeaveRequest["status"]): "approved" | "pending" | "rejected" | "muted" {
  if (status === "APPROVED") return "approved";
  if (status === "PENDING") return "pending";
  if (status === "REJECTED") return "rejected";
  return "muted";
}

function statusClass(v: ReturnType<typeof statusVariant>) {
  if (v === "approved") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (v === "pending") return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  if (v === "rejected") return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300";
  return "bg-muted text-muted-foreground";
}

export function DayDetail({ date, requests, holidays }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const fmt = useFormat();
  const dict = t.myLeaveCalendar;
  const halfDayLabels = dict.halfDay as Record<string, string>;
  const statusLabels = dict.statusLabel as Record<string, string>;

  const target = new Date(date);
  const matching = requests.filter((r) => {
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    return target >= start && target <= end;
  });
  const matchingHolidays = holidays.filter((h) => h.date.slice(0, 10) === date);

  const isEmpty = matching.length === 0 && matchingHolidays.length === 0;

  const todayKey = new Date().toISOString().slice(0, 10);
  const isPast = date < todayKey;
  const hasPendingOrApproved = matching.some((r) => r.status === "PENDING" || r.status === "APPROVED");
  const canRequest = !isPast && !hasPendingOrApproved;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]">
      <div className="flex items-center gap-2">
        <CalendarDays className="size-4 text-[var(--es-accent-600)]" />
        <div className="text-sm font-semibold">{fmt.formatDate(date)}</div>
      </div>

      {isEmpty && (
        <p className="mt-3 text-[12px] text-muted-foreground">{dict.nothing}</p>
      )}

      {matchingHolidays.length > 0 && (
        <div className="mt-3 space-y-1">
          {matchingHolidays.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-md bg-sky-50 px-3 py-2 dark:bg-sky-900/30">
              <span className="text-[13px] font-medium text-sky-700 dark:text-sky-300">
                {locale === "th" ? h.nameTh : h.nameEn}
              </span>
              <Badge variant="outline" className="text-[10px]">{dict.holidayLabel}</Badge>
            </div>
          ))}
        </div>
      )}

      {canRequest && (
        <Link
          href={`/employee/leave?startDate=${date}&endDate=${date}`}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--es-accent-400)] bg-[var(--es-accent-50)] px-3 py-2 text-[12px] font-medium text-[var(--es-accent-700)] transition-colors hover:bg-[var(--es-accent-100)] dark:bg-[var(--es-accent-950)] dark:text-[var(--es-accent-300)]"
        >
          <Plus className="size-3.5" />
          {dict.requestForDay}
        </Link>
      )}
      {isPast && isEmpty && (
        <p className="mt-2 text-[11px] text-muted-foreground">{dict.pastDayHint}</p>
      )}

      {matching.length > 0 && (
        <div className="mt-3 space-y-2">
          {matching.map((r) => {
            const variant = statusVariant(r.status);
            return (
              <div key={r.id} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold">
                    {(t.leave as Record<string, string>)[r.leaveType.toLowerCase()] ?? r.leaveType}
                  </span>
                  <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold " + statusClass(variant)}>
                    {statusLabels[r.status] ?? r.status}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{fmt.formatDate(r.startDate)} → {fmt.formatDate(r.endDate)}</span>
                  <span>· {halfDayLabels[r.halfDay] ?? r.halfDay}</span>
                </div>
                {r.reason && <p className="mt-1.5 text-[12px] text-foreground/80">{r.reason}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
