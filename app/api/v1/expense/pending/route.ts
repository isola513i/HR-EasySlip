import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiEmployee, MANAGER_ROLES } from "@/lib/security/rbac";
import { listPendingForApprover } from "@/lib/expense/expense-service";

export const GET = withApiHandler(async () => {
  const caller = await requireApiEmployee(MANAGER_ROLES);
  if (caller instanceof NextResponse) return caller;

  const items = await listPendingForApprover(caller.employeeId);
  return apiOk(items);
});
