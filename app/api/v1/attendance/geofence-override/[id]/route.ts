import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { approvalLimiter } from "@/lib/security/rate-limit";
import { decideOverride } from "@/lib/attendance/geofence-override-service";
import { GeofenceOverrideDecisionSchema } from "@/lib/attendance/geofence-override-schemas";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

export const PATCH = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, GeofenceOverrideDecisionSchema);
  const updated = await decideOverride(
    { userId: caller.userId, employeeId: caller.employeeId!, roles: caller.roles },
    ctx.params.id,
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );
  return apiOk(updated);
}, { rateLimit: approvalLimiter, rateLimitKey: "userId" });
