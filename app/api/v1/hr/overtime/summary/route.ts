import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { OTFiltersSchema } from "@/lib/overtime/schemas";
import { getOTSummaryForHR } from "@/lib/overtime/overtime-service";

const SummaryQuerySchema = OTFiltersSchema.pick({ status: true });

export const GET = withApiHandler(async (req) => {
  const auth = await requireApiRoles(HR_ROLES);
  if (auth instanceof NextResponse) return auth;

  const { status } = parseSearchParams(req, SummaryQuerySchema);
  const summary = await getOTSummaryForHR({ status });
  return apiOk(summary);
});
