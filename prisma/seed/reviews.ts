import type { PrismaClient } from "@prisma/client";
import type { EmployeeRecord } from "./employees";

export async function seedReviews(
  prisma: PrismaClient,
  employeeMap: Map<string, EmployeeRecord>,
): Promise<{ templates: number; cycles: number; reviews: number }> {
  const suda = employeeMap.get("ES0011");
  const nattapol = employeeMap.get("ES0012");
  const nattapat = employeeMap.get("ES0010");
  const mgrEng = employeeMap.get("ES0006");
  const panitan = employeeMap.get("ES0017");

  if (!suda || !nattapol || !nattapat || !mgrEng) {
    throw new Error("Required employees missing for review seeding");
  }

  // Idempotent: cascade from template → cycle → review
  await prisma.review.deleteMany({});
  await prisma.reviewCycle.deleteMany({});
  await prisma.reviewTemplate.deleteMany({});

  const template = await prisma.reviewTemplate.create({
    data: {
      name: "Standard Performance Review",
      questions: [
        { key: "goal_achievement", label: "การบรรลุเป้าหมาย (1-5)", type: "scale", required: true },
        { key: "teamwork", label: "การทำงานร่วมกับทีม (1-5)", type: "scale", required: true },
        { key: "communication", label: "การสื่อสาร (1-5)", type: "scale", required: true },
        { key: "initiative", label: "ความคิดริเริ่ม (1-5)", type: "scale", required: false },
        { key: "strengths", label: "จุดแข็งและความสำเร็จ", type: "text", required: true },
        { key: "improvements", label: "จุดที่ต้องพัฒนา", type: "text", required: true },
      ],
    },
  });

  const cycle = await prisma.reviewCycle.create({
    data: {
      name: "Performance Review Q1/2026",
      cadence: "QUARTERLY",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-04-30"),
      status: "ACTIVE",
      templateId: template.id,
    },
  });

  // Suda: self-review SUBMITTED + manager review DRAFT
  await prisma.review.create({
    data: {
      cycleId: cycle.id,
      revieweeId: suda.id,
      reviewerId: suda.id,
      reviewType: "SELF",
      status: "SUBMITTED",
      answers: {
        goal_achievement: 4,
        teamwork: 5,
        communication: 4,
        initiative: 4,
        strengths: "ส่ง sprint task ครบทุก story point ก่อน deadline; ช่วย review code จูเนียร์ทีม",
        improvements: "ต้องการพัฒนา system design ระดับ macro และทักษะ public speaking",
      },
      overallRating: 4,
      submittedAt: new Date("2026-04-15T10:00:00Z"),
    },
  });

  await prisma.review.create({
    data: {
      cycleId: cycle.id,
      revieweeId: suda.id,
      reviewerId: (panitan ?? mgrEng).id,
      reviewType: "MANAGER",
      status: "DRAFT",
    },
  });

  // Nattapol: self-review DRAFT
  await prisma.review.create({
    data: {
      cycleId: cycle.id,
      revieweeId: nattapol.id,
      reviewerId: nattapol.id,
      reviewType: "SELF",
      status: "DRAFT",
    },
  });

  // Nattapat: peer review of Suda (SUBMITTED)
  await prisma.review.create({
    data: {
      cycleId: cycle.id,
      revieweeId: suda.id,
      reviewerId: nattapat.id,
      reviewType: "PEER",
      status: "SUBMITTED",
      answers: {
        goal_achievement: 4,
        teamwork: 5,
        communication: 4,
        strengths: "พี่สุดาช่วยสอน debugging และ code review ได้ดีมาก",
        improvements: "บางทีสั่งงานเร็วเกินไปก่อนอธิบายให้เข้าใจ",
      },
      overallRating: 4,
      submittedAt: new Date("2026-04-18T14:30:00Z"),
    },
  });

  return { templates: 1, cycles: 1, reviews: 4 };
}
