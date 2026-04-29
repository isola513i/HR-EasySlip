import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface UpcomingEvent {
  id: string;
  type: "HOLIDAY";
  title: string;
  titleEn: string | null;
  date: string; // ISO date
}

/** Returns public holidays falling within the next `daysAhead` days. */
export async function getUpcomingEvents(daysAhead = 30): Promise<UpcomingEvent[]> {
  const now = new Date();
  // Normalize to start-of-today UTC so holidays whose date is today (00:00 UTC)
  // aren't filtered out by the time-of-day on `now`.
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const endDate = new Date(startOfToday.getTime() + daysAhead * DAY_MS);

  const holidays = await prisma.publicHoliday.findMany({
    where: { date: { gte: startOfToday, lte: endDate } },
    orderBy: { date: "asc" },
    take: 5,
  });

  return holidays.map((h) => ({
    id: h.id,
    type: "HOLIDAY",
    title: h.name,
    titleEn: h.nameEn,
    date: h.date.toISOString().slice(0, 10),
  }));
}
