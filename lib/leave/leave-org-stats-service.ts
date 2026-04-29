import { prisma } from "@/lib/prisma";
import type { LeaveType } from "@prisma/client";

const TRACKED: LeaveType[] = ["ANNUAL", "SICK", "PERSONAL"];

export interface LeaveTypeStats {
  type: LeaveType;
  allocated: number;
  used: number;
  pending: number;
  /** allocated - used - pending */
  available: number;
}

/**
 * Org-wide leave quota aggregate for the current calendar year, per type.
 * Sums across active employees only.
 */
export async function getOrgLeaveStats(year: number = new Date().getFullYear()): Promise<LeaveTypeStats[]> {
  const grouped = await prisma.leaveQuota.groupBy({
    by: ["leaveType"],
    where: {
      quotaYear: year,
      employee: { employmentStatus: { in: ["ACTIVE", "PROBATION"] } },
      leaveType: { in: TRACKED },
    },
    _sum: { allocatedDays: true, usedDays: true, pendingDays: true },
  });

  const map = new Map(grouped.map((g) => [g.leaveType, g]));

  return TRACKED.map((type) => {
    const row = map.get(type);
    const allocated = Number(row?._sum.allocatedDays ?? 0);
    const used = Number(row?._sum.usedDays ?? 0);
    const pending = Number(row?._sum.pendingDays ?? 0);
    return {
      type,
      allocated,
      used,
      pending,
      // Raw delta — negative indicates over-borrowed quota (e.g. manual SICK
      // beyond the 30-day cap). UI clamps the bar width separately.
      available: allocated - used - pending,
    };
  });
}

export interface PendingLeaveRow {
  id: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysRequested: string;
  reason: string;
  attachmentUrl: string | null;
  createdAt: string;
  employee: {
    id: string;
    firstNameTh: string;
    lastNameTh: string;
    employeeCode: string;
  };
}

/** All pending leave requests org-wide. HR scope only. */
export async function getAllPendingLeaves(): Promise<PendingLeaveRow[]> {
  const rows = await prisma.leaveRequest.findMany({
    where: { status: "PENDING" },
    include: {
      employee: {
        select: { id: true, firstNameTh: true, lastNameTh: true, employeeCode: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((r) => ({
    id: r.id,
    leaveType: r.leaveType,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    daysRequested: r.daysRequested.toString(),
    reason: r.reason,
    attachmentUrl: r.attachmentUrl,
    createdAt: r.createdAt.toISOString(),
    employee: r.employee,
  }));
}
