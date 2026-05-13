import type { PrismaClient } from "@prisma/client";
import type { EmployeeRecord } from "./employees";

export async function seedGeofenceOverrides(
  prisma: PrismaClient,
  employeeMap: Map<string, EmployeeRecord>,
): Promise<number> {
  const nattapol = employeeMap.get("ES0012");
  const piyanuch = employeeMap.get("ES0014");
  const suda = employeeMap.get("ES0011");
  const mgrEng = employeeMap.get("ES0006");
  const mgrMkt = employeeMap.get("ES0008");

  if (!nattapol || !piyanuch || !suda || !mgrEng || !mgrMkt) {
    throw new Error("Required employees missing for geofence override seeding");
  }

  await prisma.geofenceOverrideRequest.deleteMany({
    where: { employeeId: { in: [nattapol.id, piyanuch.id, suda.id] } },
  });

  // PENDING — Nattapol: co-working space (True Digital Park)
  await prisma.geofenceOverrideRequest.create({
    data: {
      employeeId: nattapol.id,
      requestedAt: new Date("2026-05-12T08:55:00+07:00"),
      reason: "Work from co-working space (True Digital Park) ติดงาน client",
      latitude: 13.645,
      longitude: 100.5612,
      distanceMeters: 1850,
      status: "PENDING",
      decidedById: mgrEng.id,
    },
  });

  // APPROVED — Suda: external client meeting (Siam Paragon)
  await prisma.geofenceOverrideRequest.create({
    data: {
      employeeId: suda.id,
      requestedAt: new Date("2026-05-07T09:10:00+07:00"),
      reason: "ประชุม client ที่ Siam Paragon (pre-approved by manager)",
      latitude: 13.746,
      longitude: 100.5347,
      distanceMeters: 980,
      status: "APPROVED",
      decidedById: mgrEng.id,
      decidedAt: new Date("2026-05-07T11:00:00+07:00"),
      decisionNote: "Confirmed via calendar — pre-approved client visit",
    },
  });

  // REJECTED — Piyanuch: clock-in from home without prior WFH approval
  await prisma.geofenceOverrideRequest.create({
    data: {
      employeeId: piyanuch.id,
      requestedAt: new Date("2026-05-09T09:35:00+07:00"),
      reason: "Clock-in จากบ้าน ไม่ได้แจ้งล่วงหน้า",
      latitude: 13.8011,
      longitude: 100.542,
      distanceMeters: 6200,
      status: "REJECTED",
      decidedById: mgrMkt.id,
      decidedAt: new Date("2026-05-09T10:00:00+07:00"),
      decisionNote: "ไม่ได้ขออนุญาต WFH ล่วงหน้า กรุณาขอลา PERSONAL แทน",
    },
  });

  return 3;
}
