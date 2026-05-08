import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { markAllRead } from "@/lib/notifications/notification-service";

export const POST = withApiHandler(async () => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const result = await markAllRead(caller.userId);
  return apiOk({ updated: result.count });
});
