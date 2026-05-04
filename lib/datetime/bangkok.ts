// Asia/Bangkok is UTC+7 with no DST. Hardcode the offset so client-side
// date math doesn't drift when the user runs the PWA outside Thailand
// (travel, remote staff, server clocks set to UTC).

const TZ_OFFSET_MS = 7 * 3600_000;

export function bangkokToday(now: Date = new Date()): Date {
  return new Date(now.getTime() + TZ_OFFSET_MS);
}

export function bangkokTodayKey(now: Date = new Date()): string {
  return bangkokToday(now).toISOString().slice(0, 10);
}

export function bangkokYear(now: Date = new Date()): number {
  return bangkokToday(now).getUTCFullYear();
}

export function bangkokMonth(now: Date = new Date()): number {
  // 1-12
  return bangkokToday(now).getUTCMonth() + 1;
}

export function bangkokDay(now: Date = new Date()): number {
  return bangkokToday(now).getUTCDate();
}
