import { Prisma, PrismaClient } from "@prisma/client";
import type { EmployeeRecord } from "./employees";

export async function seedAuditLogs(
  prisma: PrismaClient,
  employeeMap: Map<string, EmployeeRecord>,
): Promise<number> {
  const hrmg = employeeMap.get("ES0004");
  const mgrEng = employeeMap.get("ES0006");
  const suda = employeeMap.get("ES0011");
  const nattapol = employeeMap.get("ES0012");

  if (!hrmg || !mgrEng || !suda || !nattapol) return 0;

  const sudaSickLeave = await prisma.leaveRequest.findFirst({
    where: { employeeId: suda.id, leaveType: "SICK" },
    orderBy: { createdAt: "desc" },
  });

  const marCycle = await prisma.payrollCycle.findFirst({
    where: { year: 2026, month: 3 },
  });

  // Idempotent by action+entityId combo
  await prisma.auditLog.deleteMany({
    where: {
      action: {
        in: [
          "leave.approve",
          "employee.salary_update",
          "attendance.backfill",
          "payroll.cycle_locked",
          "leave.reject",
        ],
      },
    },
  });

  const logs = [
    {
      actorId: mgrEng.userId,
      action: "leave.approve",
      entityType: "LeaveRequest",
      entityId: sudaSickLeave?.id ?? suda.id,
      before: { status: "PENDING" },
      after: { status: "APPROVED" },
      reason: "ตรวจสอบใบรับรองแพทย์แล้ว — อนุมัติ",
      ipAddress: "203.150.25.78",
      createdAt: new Date("2026-04-09T10:00:00Z"),
    },
    {
      actorId: hrmg.userId,
      action: "employee.salary_update",
      entityType: "Employee",
      entityId: suda.id,
      before: { baseSalary: "68000" },
      after: { baseSalary: "75000" },
      reason: "เลื่อนตำแหน่งเป็น Senior SE — ปรับเงินเดือนตาม band",
      ipAddress: "171.5.196.44",
      createdAt: new Date("2024-12-31T09:30:00Z"),
    },
    {
      actorId: hrmg.userId,
      action: "attendance.backfill",
      entityType: "AttendanceRecord",
      entityId: suda.id,
      before: Prisma.JsonNull,
      after: { clockType: "OUT", clockedAt: "2026-05-04T18:15:00+07:00", isBackfilled: true },
      reason: "Time adjustment approved — auto-backfill clock-out",
      ipAddress: "171.5.196.44",
      createdAt: new Date("2026-05-05T09:00:00Z"),
    },
    {
      actorId: null, // cron/system
      action: "payroll.cycle_locked",
      entityType: "PayrollCycle",
      entityId: marCycle?.id ?? "cycle-mar-2026",
      before: { status: "OPEN" },
      after: { status: "LOCKED" },
      reason: "Cron: auto-lock at cutoff 2026-03-25T23:59:59+07:00",
      createdAt: new Date("2026-03-25T16:59:59Z"),
    },
    {
      actorId: mgrEng.userId,
      action: "leave.reject",
      entityType: "LeaveRequest",
      entityId: nattapol.id,
      before: { status: "PENDING" },
      after: { status: "REJECTED", rejectedReason: "อยู่ในช่วงทดลองงาน" },
      reason: "ยังอยู่ในช่วง probation ไม่สามารถลาประเภทนี้ได้",
      ipAddress: "203.150.25.78",
      createdAt: new Date("2026-04-16T11:00:00Z"),
    },
  ];

  for (const log of logs) {
    await prisma.auditLog.create({ data: log });
  }

  return logs.length;
}
