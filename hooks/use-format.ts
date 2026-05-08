"use client";

import { useMemo } from "react";
import { useLocale } from "@/hooks/use-locale";
import {
  formatDate,
  formatDateTime,
  formatMonthShort,
  formatRelativeTime,
  formatShortDate,
  formatTHB,
  formatTime,
} from "@/lib/format";

export function useFormat() {
  const { locale } = useLocale();
  return useMemo(
    () => ({
      formatTime: (iso: string) => formatTime(iso, locale),
      formatRelativeTime: (iso: string) => formatRelativeTime(iso, locale),
      formatDate: (iso: string) => formatDate(iso, locale),
      formatShortDate: (iso: string, year: "none" | "2-digit" | "numeric" = "none") =>
        formatShortDate(iso, year, locale),
      formatMonthShort: (monthKey: string) => formatMonthShort(monthKey, locale),
      formatDateTime: (iso: string) => formatDateTime(iso, locale),
      formatTHB: (value: number | string) => formatTHB(value, locale),
      locale,
    }),
    [locale],
  );
}
