import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiCreated } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { createOverrideRequest } from "@/lib/attendance/geofence-override-service";
import { GeofenceOverrideRequestSchema } from "@/lib/attendance/geofence-override-schemas";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

export const POST = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, GeofenceOverrideRequestSchema);
  const created = await createOverrideRequest(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    { ...input, employeeId: caller.employeeId },
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );
  return apiCreated(created);
});
