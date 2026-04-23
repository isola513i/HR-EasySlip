import type { PrismaClient } from "@prisma/client";
import type { EmployeeRecord } from "./employees";

export async function seedLeaveRequests(
  prisma: PrismaClient,
  employeeMap: Map<string, EmployeeRecord>,
) {
  const get = (code: string) => employeeMap.get(code);

  const suda = get("ES0011"); // → manager ES0006
  const nattapol = get("ES0012"); // → manager ES0006
  const piyanuch = get("ES0014"); // → manager ES0008
  const anon = get("ES0015"); // → manager ES0006
  const mgrEng = get("ES0006");
  const mgrMkt = get("ES0008");

  if (!suda || !nattapol || !piyanuch || !anon || !mgrEng || !mgrMkt) {
    throw new Error("Required employees missing for leave request seeding");
  }

  // Find leave quotas to link
  const findQuota = async (employeeId: string, leaveType: string) =>
    prisma.leaveQuota.findFirst({
      where: { employeeId, leaveType: leaveType as never, quotaYear: 2026 },
    });

  // ─── PENDING requests (3) ───
  const sudaSickQuota = await findQuota(suda.id, "SICK");
  if (sudaSickQuota) {
    await prisma.leaveRequest.create({
      data: {
        employeeId: suda.id,
        leaveType: "SICK",
        startDate: new Date("2026-04-28"),
        endDate: new Date("2026-04-29"),
        halfDay: "FULL",
        daysRequested: 2.0,
        reason: "แพทย์นัดตรวจสุขภาพ (Medical check-up)",
        status: "PENDING",
        approverId: mgrEng.id,
        quotaLockedId: sudaSickQuota.id,
      },
    });
    await prisma.leaveQuota.update({
      where: { id: sudaSickQuota.id },
      data: { pendingDays: { increment: 2.0 } },
    });
  }

  const natAnnualQuota = await findQuota(nattapol.id, "ANNUAL");
  if (natAnnualQuota) {
    await prisma.leaveRequest.create({
      data: {
        employeeId: nattapol.id,
        leaveType: "ANNUAL",
        startDate: new Date("2026-04-30"),
        endDate: new Date("2026-05-01"),
        halfDay: "FULL",
        daysRequested: 2.0,
        reason: "ท่องเที่ยวกับครอบครัว (Family trip)",
        status: "PENDING",
        approverId: mgrEng.id,
        quotaLockedId: natAnnualQuota.id,
      },
    });
    await prisma.leaveQuota.update({
      where: { id: natAnnualQuota.id },
      data: { pendingDays: { increment: 2.0 } },
    });
  }

  const piyaPersonalQuota = await findQuota(piyanuch.id, "PERSONAL");
  if (piyaPersonalQuota) {
    await prisma.leaveRequest.create({
      data: {
        employeeId: piyanuch.id,
        leaveType: "PERSONAL",
        startDate: new Date("2026-04-24"),
        endDate: new Date("2026-04-24"),
        halfDay: "AFTERNOON",
        daysRequested: 0.5,
        reason: "ธุระครอบครัว (Family matter)",
        status: "PENDING",
        approverId: mgrMkt.id,
        quotaLockedId: piyaPersonalQuota.id,
      },
    });
    await prisma.leaveQuota.update({
      where: { id: piyaPersonalQuota.id },
      data: { pendingDays: { increment: 0.5 } },
    });
  }

  // ─── APPROVED request (historical) ───
  const sudaPersonalQuota = await findQuota(suda.id, "PERSONAL");
  if (sudaPersonalQuota) {
    await prisma.leaveRequest.create({
      data: {
        employeeId: suda.id,
        leaveType: "PERSONAL",
        startDate: new Date("2026-04-10"),
        endDate: new Date("2026-04-10"),
        halfDay: "FULL",
        daysRequested: 1.0,
        reason: "ธุระส่วนตัว (Personal errand)",
        status: "APPROVED",
        approverId: mgrEng.id,
        approvedAt: new Date("2026-04-09T10:00:00Z"),
        quotaLockedId: sudaPersonalQuota.id,
      },
    });
    await prisma.leaveQuota.update({
      where: { id: sudaPersonalQuota.id },
      data: { usedDays: { increment: 1.0 } },
    });
  }

  // ─── REJECTED request (historical) ───
  await prisma.leaveRequest.create({
    data: {
      employeeId: anon.id,
      leaveType: "LEAVE_WITHOUT_PAY",
      startDate: new Date("2026-04-15"),
      endDate: new Date("2026-04-16"),
      halfDay: "FULL",
      daysRequested: 2.0,
      reason: "ต้องการหยุดเพิ่ม (Extra time off)",
      status: "REJECTED",
      approverId: mgrEng.id,
      rejectedReason: "อยู่ในช่วงทดลองงาน กรุณาปรึกษา HR ก่อน",
    },
  });

  return 5;
}
