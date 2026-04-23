// ════════════════════════════════════════════════════════════════
// Leave Query Service — read-only queries (list, detail, preview)
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import { calculateWorkingDays } from "./working-days";
import type { Role } from "@prisma/client";
import type { LeavePreviewInput, LeaveFilters } from "./schemas";

export async function previewLeave(
  employeeId: string,
  input: LeavePreviewInput,
) {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  const days = await calculateWorkingDays(startDate, endDate, input.halfDay);

  let available: number | null = null;
  let sufficient = true;

  if (input.leaveType !== "LEAVE_WITHOUT_PAY") {
    const quota = await prisma.leaveQuota.findFirst({
      where: {
        employeeId,
        leaveType: input.leaveType,
        quotaYear: startDate.getFullYear(),
      },
    });

    if (quota) {
      available = quota.allocatedDays
        .minus(quota.usedDays)
        .minus(quota.pendingDays)
        .toNumber();
      sufficient = available >= days;
    } else {
      available = 0;
      sufficient = false;
    }
  }

  return { days, available, sufficient, leaveType: input.leaveType };
}

export async function getMyLeaveRequests(
  employeeId: string,
  filters: LeaveFilters,
) {
  const where = {
    employeeId,
    ...(filters.status && { status: filters.status }),
    ...(filters.leaveType && { leaveType: filters.leaveType }),
    ...(filters.year && {
      startDate: {
        gte: new Date(`${filters.year}-01-01`),
        lte: new Date(`${filters.year}-12-31`),
      },
    }),
  };

  const [items, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.perPage,
      take: filters.perPage,
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  return { items, total, page: filters.page, perPage: filters.perPage };
}

export async function getLeaveRequestDetail(
  id: string,
  caller: { employeeId: string; roles: Role[] },
) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          id: true,
          firstNameTh: true,
          lastNameTh: true,
          employeeCode: true,
          managerId: true,
        },
      },
      approver: {
        select: { id: true, firstNameTh: true, lastNameTh: true },
      },
    },
  });

  if (!request) {
    throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
  }

  // Ownership check: owner, approver, direct manager, or HR
  const isOwner = request.employeeId === caller.employeeId;
  const isApprover = request.approverId === caller.employeeId;
  const isManager = request.employee.managerId === caller.employeeId;
  const isHR = caller.roles.some((r) =>
    (["HRMG", "HR_AUTHORIZED", "CEO", "CTO", "COO"] as string[]).includes(r),
  );
  if (!isOwner && !isApprover && !isManager && !isHR) {
    throw new DomainError(ErrorCodes.NOT_OWNER, {}, 403);
  }

  return request;
}

export async function getTeamCalendar(
  caller: { employeeId: string },
  month: number,
  year: number,
) {
  const subordinates = await prisma.employee.findMany({
    where: { managerId: caller.employeeId },
    select: { id: true },
  });
  const employeeIds = [caller.employeeId, ...subordinates.map((s) => s.id)];

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return prisma.leaveRequest.findMany({
    where: {
      employeeId: { in: employeeIds },
      status: { in: ["PENDING", "APPROVED"] },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    include: {
      employee: {
        select: { id: true, firstNameTh: true, lastNameTh: true, employeeCode: true },
      },
    },
    orderBy: { startDate: "asc" },
  });
}
