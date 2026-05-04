/** Day labels for weekly aggregates (Mon–Fri working week). */
export const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri"] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export type AttendanceStatus = "ON_TIME" | "LATE" | "ABSENT" | "ON_LEAVE" | "HOLIDAY";
