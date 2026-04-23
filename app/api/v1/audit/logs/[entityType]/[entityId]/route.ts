import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiPaginated } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiRoles } from "@/lib/security/rbac";
import { AuditTimelineQuerySchema } from "@/lib/audit/schemas";
import { getEntityTimeline } from "@/lib/audit/audit-service";

const TIMELINE_ROLES = ["HRMG", "ADMIN"] as const;

export const GET = withApiHandler(async (req, ctx) => {
  const caller = await requireApiRoles(TIMELINE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const { page, perPage } = parseSearchParams(req, AuditTimelineQuerySchema);
  const result = await getEntityTimeline(ctx.params.entityType, ctx.params.entityId, page, perPage);

  return apiPaginated(result.items, result.total, result.page, result.perPage);
});
