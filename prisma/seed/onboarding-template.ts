import type { PrismaClient } from "@prisma/client";

const DEFAULT_ITEMS = [
  { title: "กรอกข้อมูลส่วนตัว", description: "เลขบัตรประชาชน, วันเกิด, สัญชาติ, สถานะสมรส ฯลฯ", category: "personal", sortOrder: 1 },
  { title: "กรอกที่อยู่ปัจจุบัน", description: "ที่อยู่ตามทะเบียนบ้าน และที่อยู่ที่ติดต่อได้", category: "address", sortOrder: 2 },
  { title: "อัปโหลดรูปโปรไฟล์", description: "รูปประจำตัวสำหรับใช้ในระบบ HR", category: "profile_picture", sortOrder: 3 },
  { title: "กรอกผู้ติดต่อฉุกเฉิน", description: "ชื่อ, นามสกุล, ความสัมพันธ์, เบอร์โทร", category: "emergency", sortOrder: 4 },
];

export async function seedOnboardingTemplate(prisma: PrismaClient, createdBy: string) {
  const existing = await prisma.onboardingTemplate.findFirst({ where: { isDefault: true } });
  if (existing) return;

  await prisma.onboardingTemplate.create({
    data: {
      name: "Default Onboarding",
      isDefault: true,
      createdBy,
      items: { create: DEFAULT_ITEMS },
    },
  });
}
