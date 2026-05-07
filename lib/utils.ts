import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format leave type enum to title case: "LEAVE_WITHOUT_PAY" → "Leave without pay" */
export function formatLeaveType(type: string): string {
  return type.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

/** Format OvertimeType enum to display label with rate multiplier. */
export function formatOTType(type: string): string {
  if (type === "WEEKDAY") return "Weekday OT (1.5×)";
  if (type === "HOLIDAY") return "Holiday OT (3.0×)";
  if (type === "HOLIDAY_WORK") return "Holiday Work (1.0×)";
  return type;
}
