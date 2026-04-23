import type { PrismaClient } from "@prisma/client";
import type { EmployeeRecord } from "./employees";

interface ClockPair {
  /** hour:minute for clock-in (Bangkok time, subtract 7 for UTC) */
  inTime: [number, number];
  outTime: [number, number];
  location: "OFFICE" | "WFH" | "ON_SITE";
}

function utcDate(dateStr: string, bangkokH: number, bangkokM: number): Date {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCHours(bangkokH - 7, bangkokM, 0, 0);
  return d;
}

const BANGKOK_GPS = { lat: 13.7563, lng: 100.5018, accuracy: 8.5 };

export async function seedAttendanceRecords(
  prisma: PrismaClient,
  employeeMap: Map<string, EmployeeRecord>,
) {
  // Working days in April 2026 (Mon-Fri before today Apr 23)
  const workDays = ["2026-04-17", "2026-04-20", "2026-04-21", "2026-04-22"];
  const employees = ["ES0010", "ES0011", "ES0012"];

  const clockPatterns: Record<string, ClockPair[]> = {
    ES0010: [
      { inTime: [8, 45], outTime: [17, 35], location: "OFFICE" },
      { inTime: [9, 10], outTime: [18, 15], location: "WFH" },
      { inTime: [8, 30], outTime: [17, 45], location: "OFFICE" },
      { inTime: [8, 55], outTime: [18, 0], location: "WFH" },
    ],
    ES0011: [
      { inTime: [8, 30], outTime: [17, 30], location: "OFFICE" },
      { inTime: [8, 40], outTime: [17, 50], location: "OFFICE" },
      { inTime: [9, 0], outTime: [18, 30], location: "WFH" },
      { inTime: [8, 35], outTime: [17, 40], location: "OFFICE" },
    ],
    ES0012: [
      { inTime: [9, 15], outTime: [18, 20], location: "WFH" },
      { inTime: [8, 50], outTime: [17, 55], location: "OFFICE" },
      { inTime: [8, 30], outTime: [17, 30], location: "OFFICE" },
      { inTime: [9, 5], outTime: [18, 10], location: "WFH" },
    ],
  };

  let created = 0;
  for (const code of employees) {
    const emp = employeeMap.get(code);
    if (!emp) continue;

    for (let i = 0; i < workDays.length; i++) {
      const day = workDays[i];
      const pattern = clockPatterns[code][i];

      // Clock IN
      await prisma.attendanceRecord.create({
        data: {
          employeeId: emp.id,
          clockType: "IN",
          clockedAt: utcDate(day, pattern.inTime[0], pattern.inTime[1]),
          workLocation: pattern.location,
          latitude: BANGKOK_GPS.lat + (Math.random() - 0.5) * 0.01,
          longitude: BANGKOK_GPS.lng + (Math.random() - 0.5) * 0.01,
          gpsAccuracyM: BANGKOK_GPS.accuracy,
        },
      });

      // Clock OUT
      await prisma.attendanceRecord.create({
        data: {
          employeeId: emp.id,
          clockType: "OUT",
          clockedAt: utcDate(day, pattern.outTime[0], pattern.outTime[1]),
          workLocation: pattern.location,
          latitude: BANGKOK_GPS.lat + (Math.random() - 0.5) * 0.01,
          longitude: BANGKOK_GPS.lng + (Math.random() - 0.5) * 0.01,
          gpsAccuracyM: BANGKOK_GPS.accuracy,
        },
      });

      created += 2;
    }
  }

  return created;
}
