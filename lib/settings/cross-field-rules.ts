import { DomainError } from "@/lib/api/errors";

type Values = Record<string, string | number | boolean>;

interface CrossFieldRule {
  keys: string[];
  validate: (v: Values) => string | null;
}

function timeToMinutes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

const HALFDAY_KEYS = [
  "leave.halfday.morning_start",
  "leave.halfday.morning_end",
  "leave.halfday.afternoon_start",
  "leave.halfday.afternoon_end",
];

const RULES: CrossFieldRule[] = [
  {
    keys: HALFDAY_KEYS,
    validate: (v) => {
      const ms = timeToMinutes(v["leave.halfday.morning_start"]);
      const me = timeToMinutes(v["leave.halfday.morning_end"]);
      const as = timeToMinutes(v["leave.halfday.afternoon_start"]);
      const ae = timeToMinutes(v["leave.halfday.afternoon_end"]);
      if (ms !== null && me !== null && me <= ms) return "MORNING_END_AFTER_START";
      if (as !== null && ae !== null && ae <= as) return "AFTERNOON_END_AFTER_START";
      if (me !== null && as !== null && as < me) return "AFTERNOON_AFTER_MORNING_END";
      return null;
    },
  },
];

export function assertCrossFieldValid(
  currentValues: Values,
  updates: Array<{ key: string; value: string | number | boolean }>,
): void {
  if (updates.length === 0) return;
  const merged: Values = { ...currentValues };
  for (const u of updates) merged[u.key] = u.value;

  const updatedKeys = new Set(updates.map((u) => u.key));

  for (const rule of RULES) {
    const intersects = rule.keys.some((k) => updatedKeys.has(k));
    if (!intersects) continue;
    const errorCode = rule.validate(merged);
    if (errorCode) {
      throw new DomainError("CROSS_FIELD_VIOLATION", { rule: errorCode, keys: rule.keys }, 400);
    }
  }
}
