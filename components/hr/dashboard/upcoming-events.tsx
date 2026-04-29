"use client";

import { CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpcomingEvents } from "@/hooks/use-upcoming-events";
import { useT } from "@/lib/i18n/locale-context";
import { useLocale } from "@/hooks/use-locale";

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function UpcomingEvents() {
  const t = useT();
  const { locale } = useLocale();
  const { data, isLoading } = useUpcomingEvents();

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
      <div className="border-b border-border px-5 py-4 text-base font-semibold">
        {t.hr.dashboard.upcomingEvents}
      </div>
      <div className="flex flex-col gap-2.5 p-4">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[78px] rounded-lg" />)}
        {!isLoading && data.length === 0 && (
          <div className="px-2 py-8 text-center text-sm text-muted-foreground">
            {t.hr.dashboard.noUpcomingEvents}
          </div>
        )}
        {!isLoading && data.map((ev) => {
          const title = locale === "en" && ev.titleEn ? ev.titleEn : ev.title;
          return (
            <div
              key={ev.id}
              className="rounded-lg bg-[var(--es-accent-50)] px-4 py-3"
            >
              <div className="text-[13px] font-semibold leading-tight text-foreground">{title}</div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <CalendarDays className="size-3.5" />
                <span className="tabular-nums">{fmtDate(ev.date)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
