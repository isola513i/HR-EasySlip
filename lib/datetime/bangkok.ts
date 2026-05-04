// Asia/Bangkok is UTC+7 with no DST. Hardcode the offset so client-side
// date math doesn't drift when the user runs the PWA outside Thailand
// (travel, remote staff, server clocks set to UTC).

const TZ_OFFSET_MS = 7 * 3600_000;

function bangkokWallClock(now: Date = new Date()): Date {
  // Returns a Date whose UTC fields encode Bangkok wall-clock time.
  // Internal — callers should use the typed extractors below to avoid
  // misusing the result as a real instant.
  return new Date(now.getTime() + TZ_OFFSET_MS);
}

export function bangkokTodayKey(now: Date = new Date()): string {
  return bangkokWallClock(now).toISOString().slice(0, 10);
}

export function bangkokYear(now: Date = new Date()): number {
  return bangkokWallClock(now).getUTCFullYear();
}

export function bangkokMonth(now: Date = new Date()): number {
  return bangkokWallClock(now).getUTCMonth() + 1;
}

export function bangkokDay(now: Date = new Date()): number {
  return bangkokWallClock(now).getUTCDate();
}

/** Re-anchor a Bangkok-local YYYY-MM-DD to a stable UTC instant for arithmetic. */
export function bangkokDateUtc(yyyymmdd: string): Date {
  return new Date(`${yyyymmdd}T00:00:00.000Z`);
}

/** Returns YYYY-MM-DD `delta` days after the given key (negative for past). */
export function shiftIsoDays(yyyymmdd: string, delta: number): string {
  const d = bangkokDateUtc(yyyymmdd);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Returns YYYY-MM-DD shifted by `delta` years (negative for past). */
export function shiftIsoYears(yyyymmdd: string, delta: number): string {
  const d = bangkokDateUtc(yyyymmdd);
  d.setUTCFullYear(d.getUTCFullYear() + delta);
  return d.toISOString().slice(0, 10);
}

/** Extract YYYY-MM-DD from an ISO string or Date (e.g. Prisma `@db.Date` field). */
export function isoDateKey(value: string | Date): string {
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

/** First/last YYYY-MM-DD keys for a Bangkok-local month. `month` is 1-12. */
export function monthBounds(year: number, month: number): { startKey: string; endKey: string } {
  const lastDay = new Date(year, month, 0).getDate();
  const m = month.toString().padStart(2, "0");
  return {
    startKey: `${year}-${m}-01`,
    endKey: `${year}-${m}-${lastDay.toString().padStart(2, "0")}`,
  };
}
