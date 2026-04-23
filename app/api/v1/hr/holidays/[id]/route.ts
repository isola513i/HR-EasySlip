import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { HolidayUpdateSchema } from "@/lib/leave/holiday-schemas";
import { updateHoliday, deleteHoliday } from "@/lib/leave/holiday-service";

export const PUT = withApiHandler(async (req, ctx) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, HolidayUpdateSchema);
  const holiday = await updateHoliday(ctx.params.id, input, caller.userId);
  return apiOk(holiday);
});

export const DELETE = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  await deleteHoliday(ctx.params.id, caller.userId);
  return apiOk({ deleted: true });
});
