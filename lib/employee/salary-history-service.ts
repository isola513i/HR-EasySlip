import type { SalaryAdjustmentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DomainError, ErrorCodes } from "@/lib/api/errors";

export async function listSalaryAdjustments(
  employeeId: string,
  filter?: { type?: "salary" | "bonus" },
) {
  const exists = await prisma.employee.findUnique({
    where: { id: employeeId }, select: { id: true },
  });
  if (!exists) throw new DomainError(ErrorCodes.EMPLOYEE_NOT_FOUND, {}, 404);

  const isBonusFilter = filter?.type === "bonus";
  const isSalaryFilter = filter?.type === "salary";

  let where: Record<string, unknown> = { employeeId };
  if (isBonusFilter) {
    where = { ...where, adjustmentType: "BONUS_GRANT" };
  } else if (isSalaryFilter) {
    where = { ...where, adjustmentType: { not: "BONUS_GRANT" as SalaryAdjustmentType } };
  }

  const rows = await prisma.salaryAdjustment.findMany({
    where,
    orderBy: { effectiveDate: "desc" },
    take: 100,
    include: { employee: { select: { id: true } } },
  });

  // Resolve actorId → human-readable name in one round-trip.
  const actorIds = [...new Set(rows.map((r) => r.actorId))];
  const actors = actorIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: {
          id: true,
          email: true,
          employee: { select: { firstNameTh: true, lastNameTh: true } },
        },
      })
    : [];
  const actorMap = new Map(actors.map((a) => [a.id, a]));

  return rows.map((r) => {
    const a = actorMap.get(r.actorId);
    const actorName = a?.employee
      ? `${a.employee.firstNameTh} ${a.employee.lastNameTh}`
      : a?.email ?? "—";
    return { ...r, actorName };
  });
}
