import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiPaginated } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { OTFiltersSchema } from "@/lib/overtime/schemas";
import { getAllOTForHR } from "@/lib/overtime/overtime-service";

export const GET = withApiHandler(async (req) => {
  const auth = await requireApiRoles(HR_ROLES);
  if (auth instanceof NextResponse) return auth;

  const filters = parseSearchParams(req, OTFiltersSchema);
  const result = await getAllOTForHR(filters);
  return apiPaginated(result.items, result.total, result.page, result.perPage);
});
