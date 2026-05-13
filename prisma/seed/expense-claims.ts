import type { PrismaClient } from "@prisma/client";
import type { EmployeeRecord } from "./employees";

export async function seedExpenseClaims(
  prisma: PrismaClient,
  employeeMap: Map<string, EmployeeRecord>,
): Promise<number> {
  const suda = employeeMap.get("ES0011");
  const nattapol = employeeMap.get("ES0012");
  const piyanuch = employeeMap.get("ES0014");
  const nattapat = employeeMap.get("ES0010");
  const mgrEng = employeeMap.get("ES0006");
  const mgrMkt = employeeMap.get("ES0008");

  if (!suda || !nattapol || !piyanuch || !nattapat || !mgrEng || !mgrMkt) {
    throw new Error("Required employees missing for expense claim seeding");
  }

  await prisma.expenseClaim.deleteMany({
    where: { employeeId: { in: [suda.id, nattapol.id, piyanuch.id, nattapat.id] } },
  });

  // PENDING — Suda: travel to conference (BKK → Chiang Mai)
  await prisma.expenseClaim.create({
    data: {
      employeeId: suda.id,
      amountTHB: 3850.0,
      category: "TRAVEL",
      description:
        "ค่าเดินทาง BKK → เชียงใหม่ เข้าร่วม Software Architecture Summit 2026 (ตั๋วเครื่องบิน + แท็กซี่)",
      occurredOn: new Date("2026-05-08"),
      status: "PENDING",
      approverId: mgrEng.id,
    },
  });

  // APPROVED — Nattapol: team sprint dinner
  await prisma.expenseClaim.create({
    data: {
      employeeId: nattapol.id,
      amountTHB: 1250.0,
      category: "MEAL",
      description: "ค่าอาหารทีม Sprint Retrospective dinner Q1/2026",
      occurredOn: new Date("2026-04-25"),
      status: "APPROVED",
      approverId: mgrEng.id,
      approvedAt: new Date("2026-04-27T09:30:00Z"),
    },
  });

  // REJECTED — Piyanuch: camera (over budget)
  await prisma.expenseClaim.create({
    data: {
      employeeId: piyanuch.id,
      amountTHB: 18900.0,
      category: "EQUIPMENT",
      description: "กล้อง Sony ZV-E10 สำหรับถ่ายเนื้อหา Social Media",
      occurredOn: new Date("2026-04-20"),
      status: "REJECTED",
      approverId: mgrMkt.id,
      rejectedAt: new Date("2026-04-22T14:00:00Z"),
      rejectReason: "วงเงินเกิน budget กรุณาส่ง IT Request แทน",
    },
  });

  // PENDING — Nattapat: online training course
  await prisma.expenseClaim.create({
    data: {
      employeeId: nattapat.id,
      amountTHB: 4500.0,
      category: "TRAINING",
      description: "ค่าคอร์ส AWS Certified Developer – Associate (Udemy)",
      occurredOn: new Date("2026-05-01"),
      status: "PENDING",
      approverId: mgrEng.id,
    },
  });

  // APPROVED — Suda: client lunch
  await prisma.expenseClaim.create({
    data: {
      employeeId: suda.id,
      amountTHB: 2100.0,
      category: "CLIENT",
      description: "ค่าอาหารกลางวัน client meeting กับ บจ. ทีเอสซี เทค (5 คน)",
      occurredOn: new Date("2026-04-30"),
      status: "APPROVED",
      approverId: mgrEng.id,
      approvedAt: new Date("2026-05-02T08:00:00Z"),
    },
  });

  return 5;
}
