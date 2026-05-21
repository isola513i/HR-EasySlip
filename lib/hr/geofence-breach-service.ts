import { getPrisma } from "@/lib/prisma";

export interface GeofenceBreach {
  recordId: string;
  employeeId: string;
  employeeCode: string;
  firstNameTh: string;
  lastNameTh: string;
  clockType: "IN" | "OUT";
  clockedAt: string;
  workLocation: string;
  distanceMeters: number | null;
  radiusMeters: number | null;
  latitude: number | null;
  longitude: number | null;
}

const TAG = "[OUT_OF_GEOFENCE]";
const DISTANCE_RX = /~(\d+)m\s*\/\s*max\s*(\d+)m/;

function parseTag(note: string | null): { distance: number | null; radius: number | null } {
  if (!note) return { distance: null, radius: null };
  const match = DISTANCE_RX.exec(note);
  if (!match) return { distance: null, radius: null };
  return { distance: parseInt(match[1], 10), radius: parseInt(match[2], 10) };
}

export async function listRecentBreaches(
  from: Date,
  to: Date,
  limit = 100,
): Promise<GeofenceBreach[]> {
  const prisma = await getPrisma();
  const records = await prisma.attendanceRecord.findMany({
    where: {
      clockedAt: { gte: from, lte: to },
      note: { contains: TAG },
    },
    orderBy: { clockedAt: "desc" },
    take: limit,
    include: {
      employee: {
        select: {
          id: true,
          employeeCode: true,
          firstNameTh: true,
          lastNameTh: true,
        },
      },
    },
  });

  return records.map((r) => {
    const { distance, radius } = parseTag(r.note);
    return {
      recordId: r.id,
      employeeId: r.employee.id,
      employeeCode: r.employee.employeeCode,
      firstNameTh: r.employee.firstNameTh,
      lastNameTh: r.employee.lastNameTh,
      clockType: r.clockType,
      clockedAt: r.clockedAt.toISOString(),
      workLocation: r.workLocation,
      distanceMeters: distance,
      radiusMeters: radius,
      latitude: r.latitude ? Number(r.latitude) : null,
      longitude: r.longitude ? Number(r.longitude) : null,
    };
  });
}

export async function countBreachesForToday(now = new Date()): Promise<number> {
  const prisma = await getPrisma();
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setUTCHours(23, 59, 59, 999);
  return prisma.attendanceRecord.count({
    where: { clockedAt: { gte: start, lte: end }, note: { contains: TAG } },
  });
}
