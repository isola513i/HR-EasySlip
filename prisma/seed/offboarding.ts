import type { PrismaClient } from "@prisma/client";
import type { EmployeeRecord } from "./employees";

const ITEMS = [
  { key: "return_laptop", label: "คืนโน้ตบุ๊ก / อุปกรณ์ IT", completed: true, completedAt: "2026-03-28T09:00:00Z", completedBy: "HR" },
  { key: "return_access_card", label: "คืน Access Card และกุญแจสำนักงาน", completed: true, completedAt: "2026-03-31T17:00:00Z", completedBy: "HR" },
  { key: "revoke_accounts", label: "ยกเลิกสิทธิ์เข้าระบบทั้งหมด (IT Ops)", completed: true, completedAt: "2026-03-31T18:00:00Z", completedBy: "IT" },
  { key: "knowledge_transfer", label: "ส่งมอบงานและเอกสาร", completed: false, completedAt: null, completedBy: null },
  { key: "exit_interview", label: "สัมภาษณ์ก่อนออก (Exit Interview)", completed: false, completedAt: null, completedBy: null },
  { key: "final_payroll", label: "ประมวลผลเงินเดือนครั้งสุดท้าย + เงินชดเชย", completed: false, completedAt: null, completedBy: null },
  { key: "annual_leave_cashout", label: "คำนวณเงินชดเชยวันลาพักร้อนที่เหลือ", completed: false, completedAt: null, completedBy: null },
];

export async function seedOffboarding(
  prisma: PrismaClient,
  employeeMap: Map<string, EmployeeRecord>,
): Promise<number> {
  const resigned = employeeMap.get("ES0018");
  if (!resigned) return 0;

  await prisma.offboardingChecklist.deleteMany({ where: { employeeId: resigned.id } });

  await prisma.offboardingChecklist.create({
    data: {
      employeeId: resigned.id,
      reason: "RESIGNATION",
      lastDay: new Date("2026-03-31"),
      status: "IN_PROGRESS",
      items: ITEMS,
      notes: "ลาออกเพื่อไปทำงานต่างประเทศ ครบสัญญาจ้าง 4 ปี",
    },
  });

  return 1;
}
