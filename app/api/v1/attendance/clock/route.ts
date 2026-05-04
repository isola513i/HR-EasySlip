import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiCreated } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { clockLimiter } from "@/lib/security/rate-limit";
import { ClockInputSchema } from "@/lib/attendance/schemas";
import { clockInOut } from "@/lib/attendance/attendance-service";

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, ClockInputSchema);
  const { record, geofence } = await clockInOut(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  const outOfGeofence = geofence.enforced && geofence.distanceMeters !== null && !geofence.inside;
  return apiCreated({
    ...record,
    geofence: {
      enforced: geofence.enforced,
      outOfGeofence,
      distanceMeters: geofence.distanceMeters,
      radiusMeters: geofence.config.radiusMeters,
    },
  });
}, { rateLimit: clockLimiter, rateLimitKey: "userId", idempotent: true });
