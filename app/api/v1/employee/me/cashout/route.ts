import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { getPrisma } from "@/lib/prisma";

export const GET = withApiHandler(async () => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const prisma = await getPrisma();
  const items = await prisma.annualLeaveCashOut.findMany({
    where: { employeeId: caller.employeeId },
    orderBy: { year: "desc" },
    select: {
      id: true,
      year: true,
      unusedDays: true,
      trigger: true,
      exportStatus: true,
      exportedAt: true,
      computedAt: true,
    },
  });

  return apiOk(items);
});
