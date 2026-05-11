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

const EVENT_PALETTE = [
  { bg: "bg-(--es-accent-50)", icon: "text-(--es-accent-600)", strip: "bg-(--es-accent-400)" },
  { bg: "bg-(--es-info-50)", icon: "text-(--es-info-600)", strip: "bg-(--es-info-500)" },
  { bg: "bg-(--es-success-50)", icon: "text-(--es-success-600)", strip: "bg-(--es-success-500)" },
  { bg: "bg-(--es-warn-50)", icon: "text-(--es-warn-600)", strip: "bg-(--es-warn-500)" },
  { bg: "bg-[#fdf2f8]", icon: "text-[#be185d]", strip: "bg-[#ec4899]" },
  { bg: "bg-[#f3e8ff]", icon: "text-[#7e22ce]", strip: "bg-[#a855f7]" },
] as const;

export function UpcomingEvents() {
  const t = useT();
  const { locale } = useLocale();
  const { data, isLoading } = useUpcomingEvents();

  return (
    <div className="rounded-xl border border-border bg-card shadow-(--es-shadow-sm)">
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
        {!isLoading && data.map((ev, i) => {
          const title = locale === "en" && ev.titleEn ? ev.titleEn : ev.title;
          const tone = EVENT_PALETTE[i % EVENT_PALETTE.length];
          return (
            <div
              key={ev.id}
              className={`relative overflow-hidden rounded-lg px-4 py-3 pl-5 ${tone.bg}`}
            >
              <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${tone.strip}`} />
              <div className="text-[13px] font-semibold leading-tight text-foreground">{title}</div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <CalendarDays className={`size-3.5 ${tone.icon}`} />
                <span className="tabular-nums">{fmtDate(ev.date)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
