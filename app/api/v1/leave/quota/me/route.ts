import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { getMyQuota } from "@/lib/leave/leave-quota-service";

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const year = req.nextUrl.searchParams.get("year")
    ? Number(req.nextUrl.searchParams.get("year"))
    : undefined;

  const quotas = await getMyQuota(caller.employeeId, year);
  return apiOk(quotas);
});
