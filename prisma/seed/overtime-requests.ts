// ════════════════════════════════════════════════════════════════
// Seed: OvertimeRequest — populates the manager OT inbox + HR
// overtime oversight page.
// Rate multipliers per Thai labor law (CLAUDE.md §2):
//   WEEKDAY      = 1.5x
//   HOLIDAY      = 3.0x
//   HOLIDAY_WORK = 1.0x extra
// ════════════════════════════════════════════════════════════════

import type { PrismaClient } from "@prisma/client";
import type { EmployeeRecord } from "./employees";

export async function seedOvertimeRequests(
  prisma: PrismaClient,
  employeeMap: Map<string, EmployeeRecord>,
): Promise<number> {
  const get = (code: string) => employeeMap.get(code);

  const suda = get("ES0011");
  const nattapol = get("ES0012");
  const piyanuch = get("ES0014");
  const mgrEng = get("ES0006");
  const mgrMkt = get("ES0008");

  if (!suda || !nattapol || !piyanuch || !mgrEng || !mgrMkt) {
    throw new Error("Required employees missing for overtime seeding");
  }

  await prisma.overtimeRequest.deleteMany({
    where: { employeeId: { in: [suda.id, nattapol.id, piyanuch.id] } },
  });

  // 1. WEEKDAY OT — Nattapol stayed late finishing a sprint task (PENDING)
  await prisma.overtimeRequest.create({
    data: {
      employeeId: nattapol.id,
      date: new Date("2026-05-05"),
      overtimeType: "WEEKDAY",
      actualStart: new Date("2026-05-05T18:00:00+07:00"),
      actualEnd: new Date("2026-05-05T21:00:00+07:00"),
      hoursApproved: null, // pending — manager hasn't decided yet
      rateMultiplier: 1.5,
      reason: "Sprint deadline — implement leave-attachment migration",
      status: "PENDING",
      approverId: mgrEng.id,
    },
  });

  // 2. HOLIDAY OT — Suda worked Sunday (PENDING, manager pre-assigned)
  await prisma.overtimeRequest.create({
    data: {
      employeeId: suda.id,
      date: new Date("2026-05-03"), // Sunday
      overtimeType: "HOLIDAY",
      assignedStart: new Date("2026-05-03T09:00:00+07:00"),
      assignedEnd: new Date("2026-05-03T13:00:00+07:00"),
      actualStart: new Date("2026-05-03T09:05:00+07:00"),
      actualEnd: new Date("2026-05-03T13:10:00+07:00"),
      hoursApproved: null,
      rateMultiplier: 3.0,
      reason: "Production hotfix — auth session bug",
      status: "PENDING",
      approverId: mgrEng.id,
    },
  });

  // 3. WEEKDAY OT — Piyanuch (APPROVED last week)
  await prisma.overtimeRequest.create({
    data: {
      employeeId: piyanuch.id,
      date: new Date("2026-04-29"),
      overtimeType: "WEEKDAY",
      actualStart: new Date("2026-04-29T18:00:00+07:00"),
      actualEnd: new Date("2026-04-29T20:30:00+07:00"),
      hoursApproved: 2.5,
      rateMultiplier: 1.5,
      reason: "Marketing campaign launch — final review with vendor",
      status: "APPROVED",
      approverId: mgrMkt.id,
      approvedAt: new Date("2026-04-30T08:30:00+07:00"),
    },
  });

  return 3;
}
