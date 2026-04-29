import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { getManpower, todayBangkokDateString } from "@/lib/hr/manpower-service";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const dateParam = req.nextUrl.searchParams.get("date");
  const date = dateParam && DATE_RE.test(dateParam) ? dateParam : todayBangkokDateString();

  const data = await getManpower(date);

  return apiOk({ date, employees: data });
});
