// ════════════════════════════════════════════════════════════════
// Shared Date/Time Formatters — locale-aware
// ════════════════════════════════════════════════════════════════

import type { Locale } from "@/lib/i18n/config";

const TAG: Record<Locale, string> = {
  th: "th-TH",
  en: "en-GB",
};

export function formatTHB(value: number | string, locale: Locale = "th"): string {
  const n = typeof value === "string" ? Number(value) : value;
  return `฿${n.toLocaleString(TAG[locale], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const RELATIVE_LABELS = {
  th: {
    justNow: "เมื่อสักครู่",
    minutesAgo: (n: number) => `${n} นาทีที่แล้ว`,
    hoursAgo: (n: number) => `${n} ชั่วโมงที่แล้ว`,
    yesterday: "เมื่อวาน",
    daysAgo: (n: number) => `${n} วันที่แล้ว`,
  },
  en: {
    justNow: "just now",
    minutesAgo: (n: number) => `${n}m ago`,
    hoursAgo: (n: number) => `${n}h ago`,
    yesterday: "yesterday",
    daysAgo: (n: number) => `${n}d ago`,
  },
} as const;

/** Format ISO date string to HH:mm */
export function formatTime(iso: string, locale: Locale = "th"): string {
  return new Date(iso).toLocaleTimeString(TAG[locale], { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Format ISO date string to relative time */
export function formatRelativeTime(iso: string, locale: Locale = "th"): string {
  const labels = RELATIVE_LABELS[locale];
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return labels.justNow;
  if (mins < 60) return labels.minutesAgo(mins);
  const hours = Math.floor(mins / 60);
  if (hours < 24) return labels.hoursAgo(hours);
  const days = Math.floor(hours / 24);
  if (days === 1) return labels.yesterday;
  return labels.daysAgo(days);
}

/** Format ISO date string to a short readable date (weekday + month + day) */
export function formatDate(iso: string, locale: Locale = "th"): string {
  return new Date(iso).toLocaleDateString(TAG[locale], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Format ISO date string to "5 Apr" or "5 Apr 26" / "5 Apr 2026" style. */
export function formatShortDate(
  iso: string,
  year: "none" | "2-digit" | "numeric" = "none",
  locale: Locale = "th",
): string {
  return new Date(iso).toLocaleDateString(TAG[locale], {
    day: "numeric",
    month: "short",
    ...(year !== "none" && { year }),
  });
}

/** Format "YYYY-MM" key to short month name (e.g. "2026-04" → "Apr" / "เม.ย."). */
export function formatMonthShort(monthKey: string, locale: Locale = "th"): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return monthKey;
  return new Date(y, m - 1, 1).toLocaleDateString(TAG[locale], { month: "short" });
}

/** Format ISO date string to "5 Apr, 14:30" style. */
export function formatDateTime(iso: string, locale: Locale = "th"): string {
  return new Date(iso).toLocaleString(TAG[locale], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Get today's date as YYYY-MM-DD string */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Format minute count as "{h}{hAbbr} {m}{mAbbr}" — collapses zero parts and falls back to "—" for non-positive. */
export function formatHM(minutes: number, hAbbr: string, mAbbr: string): string {
  if (minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}${mAbbr}`;
  if (m === 0) return `${h}${hAbbr}`;
  return `${h}${hAbbr} ${m}${mAbbr}`;
}

/** Calculate duration between two ISO timestamps, return "HH:mm" */
export function calcDuration(startIso: string, endIso: string): string {
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (diff <= 0) return "—";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
