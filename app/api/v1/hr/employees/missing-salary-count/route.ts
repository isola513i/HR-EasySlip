import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiEmployee } from "@/lib/security/rbac";
import { SENSITIVE_DATA_ROLES } from "@/lib/security/role-helpers";
import { countEmployeesMissingBaseSalary } from "@/lib/employee/employee-service";

export const GET = withApiHandler(async () => {
  const caller = await requireApiEmployee([...SENSITIVE_DATA_ROLES]);
  if (caller instanceof NextResponse) return caller;
  const count = await countEmployeesMissingBaseSalary();
  return apiOk({ count });
});
