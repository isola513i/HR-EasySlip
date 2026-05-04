import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { listRecentBreaches } from "@/lib/hr/geofence-breach-service";

const QuerySchema = z.object({
  from: z.string().date(),
  to: z.string().date(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const { from, to, limit } = parseSearchParams(req, QuerySchema);
  const fromUtc = new Date(`${from}T00:00:00.000+07:00`);
  const toUtc = new Date(`${to}T23:59:59.999+07:00`);

  const breaches = await listRecentBreaches(fromUtc, toUtc, limit);
  return apiOk(breaches);
});
