"use client";

import { Calendar as CalendarIcon, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/shared/status-pill";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import type { Holiday } from "@/hooks/use-holidays";
import { HOLIDAY_COLOR_HEX } from "@/lib/leave/holiday-color";

interface Props {
  holidays: Holiday[];
  total: number;
  year: number;
  isLoading: boolean;
  error: string | null;
  onEdit: (h: Holiday) => void;
  onDelete: (id: string) => void;
}

export function HolidayList({
  holidays,
  total,
  year,
  isLoading,
  error,
  onEdit,
  onDelete,
}: Props) {
  const t = useT();
  const fmt = useFormat();

  return (
    <section className="flex flex-col rounded-2xl bg-card ring-1 ring-[var(--border-subtle)] shadow-[var(--es-shadow-xs)]">
      <div className="border-b border-[var(--border-subtle)] px-5 py-4">
        <h2 className="text-[15px] font-semibold tracking-tight">{t.hr.holidaysListTitle}</h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {t.hr.holidaysListCountFmt.replace("{count}", String(total))}
        </p>
      </div>

      {error ? (
        <div className="px-5 py-12 text-center text-sm text-destructive">{error}</div>
      ) : isLoading ? (
        <div className="space-y-2 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : holidays.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-12 text-muted-foreground">
          <CalendarIcon className="size-8 opacity-40" />
          <p className="text-sm">{t.hr.noHolidays.replace("{year}", String(year))}</p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border-subtle)] overflow-y-auto max-h-[calc(100vh-280px)] [scrollbar-width:thin]">
          {holidays.map((h) => (
            <li
              key={h.id}
              className="group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
            >
              <div
                className="flex size-10 shrink-0 flex-col items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: HOLIDAY_COLOR_HEX[h.color ?? "red"] }}
              >
                <span className="text-[14px] font-bold leading-none tabular-nums">
                  {new Date(h.date).getDate()}
                </span>
                <span className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-wider opacity-70">
                  {fmt.formatMonthShort(h.date.slice(0, 7))}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-medium leading-tight">{h.name}</div>
                {h.nameEn && (
                  <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{h.nameEn}</div>
                )}
                <div className="mt-1.5">
                  <StatusPill tone={h.isSubstituted ? "neutral" : "info"} dot={false}>
                    {h.isSubstituted ? t.hr.substituted : t.hr.regular}
                  </StatusPill>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onEdit(h)}
                  aria-label={t.hr.editHolidayTitle}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onDelete(h.id)}
                  aria-label={t.common.delete}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
