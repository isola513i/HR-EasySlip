import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles } from "@/lib/security/rbac";
import { retryEvent } from "@/lib/system/outbox-service";

const ADMIN_ROLES = ["ADMIN"] as const;

export const POST = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(ADMIN_ROLES);
  if (caller instanceof NextResponse) return caller;

  const result = await retryEvent(ctx.params.eventId);
  return apiOk(result);
});
