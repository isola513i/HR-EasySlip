import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles } from "@/lib/security/rbac";
import { SENSITIVE_DATA_ROLES } from "@/lib/security/role-helpers";
import { listSalaryAdjustments } from "@/lib/employee/salary-history-service";

export const GET = withApiHandler(async (req, ctx) => {
  // Salary history is sensitive PDPA data — gate by SENSITIVE_DATA_ROLES.
  const caller = await requireApiRoles(SENSITIVE_DATA_ROLES);
  if (caller instanceof NextResponse) return caller;

  const url = new URL(req.url);
  const typeParam = url.searchParams.get("type");
  const filter: { type: "salary" | "bonus" } | undefined =
    typeParam === "bonus" ? { type: "bonus" } :
    typeParam === "salary" ? { type: "salary" } :
    undefined;

  const items = await listSalaryAdjustments(ctx.params.employeeId, filter);
  return apiOk(items);
});
