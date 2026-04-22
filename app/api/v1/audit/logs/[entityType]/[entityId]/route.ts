import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles } from "@/lib/security/rbac";
import { getEntityTimeline } from "@/lib/audit/audit-service";

const TIMELINE_ROLES = ["HRMG", "ADMIN"] as const;

export const GET = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(TIMELINE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const timeline = await getEntityTimeline(ctx.params.entityType, ctx.params.entityId);
  return apiOk(timeline);
});
