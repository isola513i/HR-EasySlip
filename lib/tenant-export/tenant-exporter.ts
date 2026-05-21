import type { PrismaClient } from "@prisma/client";
import { getSettingValue } from "@/lib/settings/settings-service";

/** Full PDPA data-portability export for a tenant. ~50 employees → sync is fine. */
export async function generateTenantExport(prisma: PrismaClient) {
  const retentionDays = await getSettingValue<number>("pdpa.audit_log.retention_days");
  const auditCutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1_000);
  const attendanceCutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1_000);

  const [
    employees,
    leaveRequests,
    overtimeRequests,
    expenseClaims,
    attendanceRecords,
    payrollCycles,
    auditLogs,
    settings,
    consentRecords,
  ] = await Promise.all([
    prisma.employee.findMany({
      include: { department: { select: { name: true } }, position: { select: { name: true } } },
      orderBy: { employeeCode: "asc" },
    }),
    prisma.leaveRequest.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.overtimeRequest.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.expenseClaim.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.attendanceRecord.findMany({
      where: { clockedAt: { gte: attendanceCutoff } },
      orderBy: { clockedAt: "desc" },
    }),
    prisma.payrollCycle.findMany({ orderBy: { year: "desc" } }),
    prisma.auditLog.findMany({
      where: { createdAt: { gte: auditCutoff } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.systemConfig.findMany(),
    prisma.consentRecord.findMany({ orderBy: { grantedAt: "desc" } }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    retentionPolicy: { auditLogDays: retentionDays, attendanceDays: 365 },
    employees,
    leaveRequests,
    overtimeRequests,
    expenseClaims,
    attendanceRecords,
    payrollCycles,
    auditLogs,
    settings,
    consentRecords,
  };
}
