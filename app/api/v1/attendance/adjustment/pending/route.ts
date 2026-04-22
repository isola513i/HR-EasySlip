import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiPaginated } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiRoles, MANAGER_ROLES } from "@/lib/security/rbac";
import { TimeAdjFiltersSchema } from "@/lib/time-adjustment/schemas";
import { getPendingForApprover } from "@/lib/time-adjustment/time-adjustment-service";

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(MANAGER_ROLES);
  if (caller instanceof NextResponse) return caller;
  if (!caller.employeeId) {
    return NextResponse.json({ ok: false, error: "No employee record" }, { status: 403 });
  }

  const filters = parseSearchParams(req, TimeAdjFiltersSchema);
  const result = await getPendingForApprover(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    filters,
  );

  return apiPaginated(result.items, result.total, result.page, result.perPage);
});
