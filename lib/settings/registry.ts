// ════════════════════════════════════════════════════════════════
// Settings registry — single source of truth for editable settings
// ────────────────────────────────────────────────────────────────
// Defines validation, UI input type, group, ordering, and units.
// Used by both API (for value validation) and UI (for rendering).
// ════════════════════════════════════════════════════════════════

import { z } from "zod";

export type SettingGroup = "leave" | "payroll" | "attendance" | "geofence" | "pdpa";
export type SettingInputType = "number" | "text" | "boolean" | "time" | "decimal" | "string-version";

export interface SettingDefinition {
  key: string;
  group: SettingGroup;
  inputType: SettingInputType;
  validator: z.ZodType<string | number | boolean>;
  defaultValue: string | number | boolean;
  unitKey?: "minutes" | "days" | "hours" | "percent" | "meters" | "version" | "time";
  /** order within group; lower first */
  order: number;
  /** restrict numeric input via UI */
  min?: number;
  max?: number;
  step?: number;
}

const HHMM = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "INVALID_TIME_FORMAT");
const SEMVER = z.string().regex(/^\d+\.\d+(\.\d+)?$/, "INVALID_VERSION_FORMAT");
const LATITUDE = z.number().min(-90).max(90);
const LONGITUDE = z.number().min(-180).max(180);

export const SETTINGS_REGISTRY: Record<string, SettingDefinition> = {
  // ─── Leave: half-day windows ───
  "leave.halfday.morning_start": {
    key: "leave.halfday.morning_start",
    group: "leave",
    inputType: "time",
    validator: HHMM,
    defaultValue: "09:00",
    unitKey: "time",
    order: 10,
  },
  "leave.halfday.morning_end": {
    key: "leave.halfday.morning_end",
    group: "leave",
    inputType: "time",
    validator: HHMM,
    defaultValue: "13:00",
    unitKey: "time",
    order: 11,
  },
  "leave.halfday.afternoon_start": {
    key: "leave.halfday.afternoon_start",
    group: "leave",
    inputType: "time",
    validator: HHMM,
    defaultValue: "13:00",
    unitKey: "time",
    order: 12,
  },
  "leave.halfday.afternoon_end": {
    key: "leave.halfday.afternoon_end",
    group: "leave",
    inputType: "time",
    validator: HHMM,
    defaultValue: "18:00",
    unitKey: "time",
    order: 13,
  },

  // ─── Leave: quotas ───
  "leave.sick.max_paid_days": {
    key: "leave.sick.max_paid_days",
    group: "leave",
    inputType: "number",
    validator: z.number().int().min(0).max(365),
    defaultValue: 30,
    unitKey: "days",
    order: 20,
    min: 0,
    max: 365,
    step: 1,
  },
  "leave.personal.max_days": {
    key: "leave.personal.max_days",
    group: "leave",
    inputType: "number",
    validator: z.number().int().min(0).max(30),
    defaultValue: 3,
    unitKey: "days",
    order: 21,
    min: 0,
    max: 30,
    step: 1,
  },
  "leave.annual.full_year_days": {
    key: "leave.annual.full_year_days",
    group: "leave",
    inputType: "number",
    validator: z.number().int().min(0).max(60),
    defaultValue: 6,
    unitKey: "days",
    order: 22,
    min: 0,
    max: 60,
    step: 1,
  },
  "leave.annual.rounding_step": {
    key: "leave.annual.rounding_step",
    group: "leave",
    inputType: "decimal",
    validator: z.number().min(0.1).max(1),
    defaultValue: 0.5,
    unitKey: "days",
    order: 23,
    min: 0.1,
    max: 1,
    step: 0.1,
  },
  "leave.annual.days_in_year_basis": {
    key: "leave.annual.days_in_year_basis",
    group: "leave",
    inputType: "number",
    validator: z.number().int().min(360).max(366),
    defaultValue: 365,
    unitKey: "days",
    order: 24,
    min: 360,
    max: 366,
    step: 1,
  },
  "leave.maternity.days": {
    key: "leave.maternity.days",
    group: "leave",
    inputType: "number",
    validator: z.number().int().min(60).max(180),
    defaultValue: 98,
    unitKey: "days",
    order: 25,
    min: 60,
    max: 180,
    step: 1,
  },

  // ─── Payroll ───
  "payroll.cutoff.day_of_month": {
    key: "payroll.cutoff.day_of_month",
    group: "payroll",
    inputType: "number",
    validator: z.number().int().min(1).max(28),
    defaultValue: 25,
    unitKey: "days",
    order: 10,
    min: 1,
    max: 28,
    step: 1,
  },

  // ─── Attendance ───
  "attendance.late_threshold_minutes": {
    key: "attendance.late_threshold_minutes",
    group: "attendance",
    inputType: "number",
    validator: z.number().int().min(0).max(120),
    defaultValue: 15,
    unitKey: "minutes",
    order: 10,
    min: 0,
    max: 120,
    step: 1,
  },
  "attendance.gps.capture_enabled": {
    key: "attendance.gps.capture_enabled",
    group: "attendance",
    inputType: "boolean",
    validator: z.boolean(),
    defaultValue: true,
    order: 20,
  },

  // ─── Geofence (separate group for clarity) ───
  "attendance.gps.enforce_geofence": {
    key: "attendance.gps.enforce_geofence",
    group: "geofence",
    inputType: "boolean",
    validator: z.boolean(),
    defaultValue: false,
    order: 10,
  },
  "attendance.geofence.center_lat": {
    key: "attendance.geofence.center_lat",
    group: "geofence",
    inputType: "decimal",
    validator: LATITUDE,
    defaultValue: 13.7563,
    order: 20,
    min: -90,
    max: 90,
    step: 0.000001,
  },
  "attendance.geofence.center_lng": {
    key: "attendance.geofence.center_lng",
    group: "geofence",
    inputType: "decimal",
    validator: LONGITUDE,
    defaultValue: 100.5018,
    order: 21,
    min: -180,
    max: 180,
    step: 0.000001,
  },
  "attendance.geofence.radius_meters": {
    key: "attendance.geofence.radius_meters",
    group: "geofence",
    inputType: "number",
    validator: z.number().int().min(50).max(50000),
    defaultValue: 500,
    unitKey: "meters",
    order: 22,
    min: 50,
    max: 50000,
    step: 50,
  },

  // ─── PDPA ───
  "pdpa.consent.current_version": {
    key: "pdpa.consent.current_version",
    group: "pdpa",
    inputType: "string-version",
    validator: SEMVER,
    defaultValue: "1.0",
    unitKey: "version",
    order: 10,
  },
  "pdpa.audit_log.retention_days": {
    key: "pdpa.audit_log.retention_days",
    group: "pdpa",
    inputType: "number",
    validator: z.number().int().min(30).max(3650),
    defaultValue: 90,
    unitKey: "days",
    order: 20,
    min: 30,
    max: 3650,
    step: 1,
  },
};

export function getDefinition(key: string): SettingDefinition | undefined {
  return SETTINGS_REGISTRY[key];
}

export function listDefinitions(): SettingDefinition[] {
  return Object.values(SETTINGS_REGISTRY);
}

/** Validate a value against the registry definition. Returns the parsed (coerced) value or throws. */
export function validateSettingValue(key: string, value: unknown): string | number | boolean {
  const def = getDefinition(key);
  if (!def) {
    throw new Error(`UNKNOWN_SETTING_KEY:${key}`);
  }
  const result = def.validator.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0]?.message ?? "INVALID_VALUE";
    throw new Error(`INVALID_VALUE:${key}:${issue}`);
  }
  return result.data;
}
