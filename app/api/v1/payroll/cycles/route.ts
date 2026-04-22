import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiRoles } from "@/lib/security/rbac";
import { CycleListSchema } from "@/lib/payroll/schemas";
import { listCycles } from "@/lib/payroll/payroll-service";

const CYCLE_ROLES = ["HRMG", "HR_AUTHORIZED", "CEO", "CTO", "COO"] as const;

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(CYCLE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const { year, status } = parseSearchParams(req, CycleListSchema);
  const cycles = await listCycles(year, status);

  return apiOk(cycles);
});
