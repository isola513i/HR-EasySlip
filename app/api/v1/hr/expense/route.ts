import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { ExpenseListFiltersSchema } from "@/lib/expense/schemas";
import { listAllForHR } from "@/lib/expense/expense-service";

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const filters = parseSearchParams(req, ExpenseListFiltersSchema);
  const result = await listAllForHR(filters);
  return apiOk(result);
});
