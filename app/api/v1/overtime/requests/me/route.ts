import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiPaginated } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { OTFiltersSchema } from "@/lib/overtime/schemas";
import { getMyOTRequests } from "@/lib/overtime/overtime-service";

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const filters = parseSearchParams(req, OTFiltersSchema);
  const result = await getMyOTRequests(caller.employeeId, filters);

  return apiPaginated(result.items, result.total, result.page, result.perPage);
});
