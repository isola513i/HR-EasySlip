import { getSettingValues } from "@/lib/settings/settings-service";

export interface HalfDayWindows {
  morningStart: string; // HH:mm
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
}

export interface AttendancePolicy {
  lateAfter: { h: number; m: number };
  shiftStart: { h: number; m: number };
  lateThresholdMinutes: number;
  gpsCaptureEnabled: boolean;
  enforceGeofence: boolean;
  halfday: HalfDayWindows;
}

const KEYS = [
  "leave.halfday.morning_start",
  "leave.halfday.morning_end",
  "leave.halfday.afternoon_start",
  "leave.halfday.afternoon_end",
  "attendance.late_threshold_minutes",
  "attendance.gps.capture_enabled",
  "attendance.gps.enforce_geofence",
];

function parseHHmm(value: unknown, fallback: { h: number; m: number }) {
  if (typeof value !== "string") return fallback;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return fallback;
  return { h: parseInt(match[1], 10), m: parseInt(match[2], 10) };
}

function addMinutes(t: { h: number; m: number }, mins: number) {
  const total = t.h * 60 + t.m + mins;
  return { h: Math.floor(total / 60) % 24, m: total % 60 };
}

function asHHmm(value: unknown, fallback: string): string {
  return typeof value === "string" && /^(\d{2}):(\d{2})$/.test(value) ? value : fallback;
}

export async function loadAttendancePolicy(): Promise<AttendancePolicy> {
  const values = await getSettingValues(KEYS);
  const shiftStart = parseHHmm(values["leave.halfday.morning_start"], { h: 9, m: 0 });
  const threshold = Number(values["attendance.late_threshold_minutes"] ?? 15);
  return {
    shiftStart,
    lateThresholdMinutes: threshold,
    lateAfter: addMinutes(shiftStart, threshold),
    gpsCaptureEnabled: Boolean(values["attendance.gps.capture_enabled"] ?? true),
    enforceGeofence: Boolean(values["attendance.gps.enforce_geofence"] ?? false),
    halfday: {
      morningStart: asHHmm(values["leave.halfday.morning_start"], "09:00"),
      morningEnd: asHHmm(values["leave.halfday.morning_end"], "13:00"),
      afternoonStart: asHHmm(values["leave.halfday.afternoon_start"], "13:00"),
      afternoonEnd: asHHmm(values["leave.halfday.afternoon_end"], "18:00"),
    },
  };
}
