import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiCreated } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { OTSubmitWeekdaySchema, OTSubmitHolidaySchema } from "@/lib/overtime/schemas";
import { submitWeekdayOT, submitHolidayOT } from "@/lib/overtime/overtime-service";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

export const POST = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const raw = await req.json();

  // Detect weekday vs holiday by presence of assignedStart
  if ("assignedStart" in raw) {
    const input = OTSubmitHolidaySchema.parse(raw);
    const result = await submitHolidayOT(
      { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
      input,
      { ip: ctx.ip, userAgent: ctx.userAgent },
    );
    return apiCreated(result);
  }

  const input = OTSubmitWeekdaySchema.parse(raw);
  const result = await submitWeekdayOT(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );
  return apiCreated(result);
}, { idempotent: true });
