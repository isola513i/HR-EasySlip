import type { HolidayColor } from "@/hooks/use-holidays";

export const HOLIDAY_COLOR_HEX: Record<HolidayColor, string> = {
  red:    "#ef4444",
  orange: "#f97316",
  amber:  "#f59e0b",
  green:  "#22c55e",
  blue:   "#3b82f6",
};

export const HOLIDAY_COLOR_LABELS: Record<HolidayColor, { th: string; en: string }> = {
  red:    { th: "แดง",    en: "Red" },
  orange: { th: "ส้ม",    en: "Orange" },
  amber:  { th: "เหลือง", en: "Amber" },
  green:  { th: "เขียว",  en: "Green" },
  blue:   { th: "น้ำเงิน", en: "Blue" },
};

export const ALL_HOLIDAY_COLORS: HolidayColor[] = ["red", "orange", "amber", "green", "blue"];
