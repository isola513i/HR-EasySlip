import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ExpenseListFilters } from "./schemas";

const EMPLOYEE_MINI = {
  id: true,
  employeeCode: true,
  firstNameTh: true,
  lastNameTh: true,
};

async function paginated(
  where: Prisma.ExpenseClaimWhereInput,
  filters: ExpenseListFilters,
  withEmployee: boolean,
) {
  const [items, total] = await Promise.all([
    prisma.expenseClaim.findMany({
      where,
      include: withEmployee
        ? {
            employee: { select: EMPLOYEE_MINI },
            approver: { select: EMPLOYEE_MINI },
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.perPage,
      take: filters.perPage,
    }),
    prisma.expenseClaim.count({ where }),
  ]);
  return { items, total, page: filters.page, perPage: filters.perPage };
}

export function listMyExpenses(employeeId: string, filters: ExpenseListFilters) {
  return paginated(
    { employeeId, ...(filters.status ? { status: filters.status } : {}) },
    filters,
    false,
  );
}

export function listAllForHR(filters: ExpenseListFilters) {
  return paginated(filters.status ? { status: filters.status } : {}, filters, true);
}

export async function listPendingForApprover(employeeId: string) {
  return prisma.expenseClaim.findMany({
    where: { status: "PENDING", employee: { managerId: employeeId } },
    include: { employee: { select: EMPLOYEE_MINI } },
    orderBy: { createdAt: "asc" },
  });
}
