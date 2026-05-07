import { prisma } from "@/lib/prisma";
import { loadEmployeeAttendancePolicy } from "./policy";

export interface TimesheetEntry {
  date: string;
  firstIn: string | null;
  lastOut: string | null;
  workedMinutes: number;
  lateMinutes: number;
  workLocation: string | null;
  hasBackfill: boolean;
  recordCount: number;
}

export interface TimesheetSummary {
  totalDays: number;
  workedMinutes: number;
  lateDays: number;
  averageMinutesPerDay: number;
}

const TZ_OFFSET_HOURS = 7;

function toBangkokDateKey(d: Date): string {
  const ms = d.getTime() + TZ_OFFSET_HOURS * 3600_000;
  return new Date(ms).toISOString().slice(0, 10);
}

export async function getEmployeeTimesheet(
  employeeId: string,
  from: string,
  to: string,
): Promise<{ entries: TimesheetEntry[]; summary: TimesheetSummary }> {
  const fromUtc = new Date(`${from}T00:00:00.000+07:00`);
  const toUtc = new Date(`${to}T23:59:59.999+07:00`);

  const [records, policy] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { employeeId, clockedAt: { gte: fromUtc, lte: toUtc } },
      orderBy: { clockedAt: "asc" },
    }),
    loadEmployeeAttendancePolicy(employeeId),
  ]);

  const shiftStart = policy.shiftStart;

  const buckets = new Map<string, typeof records>();
  for (const r of records) {
    const key = toBangkokDateKey(r.clockedAt);
    const arr = buckets.get(key);
    if (arr) arr.push(r);
    else buckets.set(key, [r]);
  }

  const entries: TimesheetEntry[] = Array.from(buckets.entries())
    .map(([date, rows]) => {
      const ins = rows.filter((r) => r.clockType === "IN").sort((a, b) => +a.clockedAt - +b.clockedAt);
      const outs = rows.filter((r) => r.clockType === "OUT").sort((a, b) => +a.clockedAt - +b.clockedAt);
      const firstIn = ins[0]?.clockedAt ?? null;
      const lastOut = outs[outs.length - 1]?.clockedAt ?? null;

      let workedMinutes = 0;
      if (firstIn && lastOut && +lastOut > +firstIn) {
        workedMinutes = Math.round((+lastOut - +firstIn) / 60_000);
      }

      let lateMinutes = 0;
      if (firstIn) {
        const localFirstIn = new Date(+firstIn + TZ_OFFSET_HOURS * 3600_000);
        const expectedMinutes = shiftStart.h * 60 + shiftStart.m;
        const actualMinutes = localFirstIn.getUTCHours() * 60 + localFirstIn.getUTCMinutes();
        if (actualMinutes > expectedMinutes) lateMinutes = actualMinutes - expectedMinutes;
      }

      return {
        date,
        firstIn: firstIn?.toISOString() ?? null,
        lastOut: lastOut?.toISOString() ?? null,
        workedMinutes,
        lateMinutes,
        workLocation: rows[0]?.workLocation ?? null,
        hasBackfill: rows.some((r) => r.isBackfilled),
        recordCount: rows.length,
      } satisfies TimesheetEntry;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const totalWorked = entries.reduce((acc, e) => acc + e.workedMinutes, 0);
  const lateDays = entries.filter((e) => e.lateMinutes > 0).length;

  return {
    entries,
    summary: {
      totalDays: entries.length,
      workedMinutes: totalWorked,
      lateDays,
      averageMinutesPerDay: entries.length === 0 ? 0 : Math.round(totalWorked / entries.length),
    },
  };
}
