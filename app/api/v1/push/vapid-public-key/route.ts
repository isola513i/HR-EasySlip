import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk, apiError } from "@/lib/api/response";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";

export const GET = withApiHandler(async () => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return apiError("PUSH_NOT_CONFIGURED", "VAPID keys not set", 503);

  return apiOk({ publicKey: key });
});
