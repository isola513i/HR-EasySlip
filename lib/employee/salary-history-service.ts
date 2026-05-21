import type { SalaryAdjustmentType } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getControlPlane } from "@/lib/db/control-plane";
import { DomainError, ErrorCodes } from "@/lib/api/errors";

export async function listSalaryAdjustments(
  employeeId: string,
  filter?: { type?: "salary" | "bonus" },
) {
  const prisma = await getPrisma();
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

  // Resolve actorId → human-readable name in one round-trip (CP DB).
  const actorIds = [...new Set(rows.map((r) => r.actorId))];
  const cp = getControlPlane();
  const cpUsers = actorIds.length > 0
    ? await cp.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, email: true },
      })
    : [];
  const userMap = new Map(cpUsers.map((u) => [u.id, u]));

  return rows.map((r) => {
    const a = userMap.get(r.actorId);
    const actorName = a?.email ?? "—";
    return { ...r, actorName };
  });
}
