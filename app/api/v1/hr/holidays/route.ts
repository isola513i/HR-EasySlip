import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk, apiCreated } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { HolidayCreateSchema } from "@/lib/leave/holiday-schemas";
import { listHolidays, createHoliday } from "@/lib/leave/holiday-service";

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const year = req.nextUrl.searchParams.get("year")
    ? Number(req.nextUrl.searchParams.get("year"))
    : undefined;

  const holidays = await listHolidays(year);
  return apiOk(holidays);
});

export const POST = withApiHandler(async (req) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, HolidayCreateSchema);
  const holiday = await createHoliday(input, caller.userId);
  return apiCreated(holiday);
});
