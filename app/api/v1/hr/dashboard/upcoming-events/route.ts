import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { getUpcomingEvents } from "@/lib/hr/upcoming-events-service";

export const GET = withApiHandler(async () => {
  const auth = await requireApiRoles(HR_ROLES);
  if (auth instanceof NextResponse) return auth;

  const events = await getUpcomingEvents(30);
  return apiOk(events);
});
