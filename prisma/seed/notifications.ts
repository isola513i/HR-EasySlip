import type { PrismaClient } from "@prisma/client";
import type { EmployeeRecord } from "./employees";

export async function seedNotifications(
  prisma: PrismaClient,
  employeeMap: Map<string, EmployeeRecord>,
): Promise<number> {
  const cycle = await prisma.payrollCycle.findFirst({
    where: { year: 2026, month: 5 },
  });
  if (!cycle) return 0;

  const hrmg = employeeMap.get("ES0004");
  const mgrEng = employeeMap.get("ES0006");
  const mgrMkt = employeeMap.get("ES0008");
  const panitan = employeeMap.get("ES0017");

  if (!hrmg || !mgrEng || !mgrMkt) return 0;

  type NotifDef = {
    userId: string;
    kind: "PAYROLL_CUTOFF_T3" | "PAYROLL_CUTOFF_T1" | "PAYROLL_CUTOFF_DDAY";
    refId: string;
    meta: object;
    title: string;
    body: string;
    link: string;
    readAt?: Date;
  };

  const notifs: NotifDef[] = [
    {
      userId: hrmg.userId,
      kind: "PAYROLL_CUTOFF_T3",
      refId: cycle.id,
      meta: { month: 5, year: 2026, daysLeft: 3, cutoffDate: "2026-05-25" },
      title: "ใกล้ถึงวันปิดงวดเงินเดือน (อีก 3 วัน)",
      body: "โปรดตรวจสอบ: OT 2 รายการ, ลา 3 รายการ ยังรอการอนุมัติ",
      link: "/payroll",
    },
    {
      userId: hrmg.userId,
      kind: "PAYROLL_CUTOFF_T1",
      refId: cycle.id,
      meta: { month: 5, year: 2026, daysLeft: 1, cutoffDate: "2026-05-25" },
      title: "วันพรุ่งนี้คือวันปิดงวดเงินเดือน!",
      body: "ตรวจสอบและอนุมัติรายการค้างทั้งหมดก่อน 23:59 น. พรุ่งนี้",
      link: "/payroll",
      readAt: new Date("2026-05-24T09:00:00Z"),
    },
    {
      userId: mgrEng.userId,
      kind: "PAYROLL_CUTOFF_T3",
      refId: cycle.id,
      meta: { month: 5, year: 2026, daysLeft: 3, cutoffDate: "2026-05-25" },
      title: "ใกล้ถึงวันปิดงวด — รายการค้างอนุมัติ",
      body: "OT 1 รายการ และลา 2 รายการ รอการอนุมัติจากคุณ",
      link: "/manager/approvals",
    },
    {
      userId: mgrMkt.userId,
      kind: "PAYROLL_CUTOFF_T3",
      refId: cycle.id,
      meta: { month: 5, year: 2026, daysLeft: 3, cutoffDate: "2026-05-25" },
      title: "ใกล้ถึงวันปิดงวด — รายการค้างอนุมัติ",
      body: "ลา 1 รายการ รอการอนุมัติจากคุณ",
      link: "/manager/approvals",
    },
    ...(panitan
      ? [
          {
            userId: panitan.userId,
            kind: "PAYROLL_CUTOFF_DDAY" as const,
            refId: cycle.id,
            meta: { month: 5, year: 2026, cutoffDate: "2026-05-25" },
            title: "วันนี้คือวันปิดงวดเงินเดือน",
            body: "ระบบจะล็อครายการเวลา 23:59 น. คืนนี้",
            link: "/manager/approvals",
          },
        ]
      : []),
  ];

  let count = 0;
  for (const n of notifs) {
    await prisma.notification.upsert({
      where: { userId_kind_refId: { userId: n.userId, kind: n.kind, refId: n.refId } },
      create: n,
      update: {},
    });
    count++;
  }

  return count;
}
