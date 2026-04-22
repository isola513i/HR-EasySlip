// ════════════════════════════════════════════════════════════════
// Empeo Formatter — format timestamps for Empeo import
// Template: TemplateTimeStamps.xlsx
// Columns: ชื่อบริษัท, รหัสพนักงาน, วันที่ (d/M/yyyy), เวลา (H:mm)
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";

const BANGKOK_TZ = "Asia/Bangkok";

const COMPANY_NAME = "บริษัท โกไฟว์ จำกัด";
const CSV_HEADER = "\uFEFFชื่อบริษัท,รหัสพนักงาน,วันที่ (d/M/yyyy),เวลา (H:mm)";

interface TimestampRecord {
  employeeCode: string;
  clockedAt: Date;
}

export async function getTimestampRecords(cycleId: string): Promise<TimestampRecord[]> {
  const cycle = await prisma.payrollCycle.findUnique({
    where: { id: cycleId },
    select: { cycleStart: true, cycleEnd: true },
  });

  if (!cycle) return [];

  const records = await prisma.attendanceRecord.findMany({
    where: {
      clockedAt: { gte: cycle.cycleStart, lte: cycle.cycleEnd },
    },
    include: {
      employee: { select: { employeeCode: true } },
    },
    orderBy: [{ employee: { employeeCode: "asc" } }, { clockedAt: "asc" }],
  });

  return records.map((r) => ({
    employeeCode: r.employee.employeeCode,
    clockedAt: r.clockedAt,
  }));
}

export function formatTimestampsToCSV(records: TimestampRecord[]): string {
  const lines = [CSV_HEADER];

  for (const r of records) {
    const bkkTime = new TZDate(r.clockedAt, BANGKOK_TZ);
    const date = format(bkkTime, "d/M/yyyy");
    const time = format(bkkTime, "H:mm") + " น.";
    lines.push(`${COMPANY_NAME},${r.employeeCode},${date},${time}`);
  }

  return lines.join("\n");
}

export async function generateTimestampExport(cycleId: string) {
  const records = await getTimestampRecords(cycleId);
  return formatTimestampsToCSV(records);
}
