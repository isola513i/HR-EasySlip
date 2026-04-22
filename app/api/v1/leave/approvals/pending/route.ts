import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiPaginated } from "@/lib/api/response";
import { requireApiRoles, MANAGER_ROLES } from "@/lib/security/rbac";
import { getPendingForApprover } from "@/lib/leave/leave-approval-service";

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(MANAGER_ROLES);
  if (caller instanceof NextResponse) return caller;
  if (!caller.employeeId) {
    return NextResponse.json({ ok: false, error: "No employee record" }, { status: 403 });
  }

  const page = Number(req.nextUrl.searchParams.get("page") ?? 1);
  const perPage = Number(req.nextUrl.searchParams.get("perPage") ?? 20);

  const result = await getPendingForApprover(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    page,
    perPage,
  );

  return apiPaginated(result.items, result.total, result.page, result.perPage);
});
