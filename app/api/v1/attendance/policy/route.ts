import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { loadAttendancePolicy } from "@/lib/attendance/policy";

export const GET = withApiHandler(async () => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const policy = await loadAttendancePolicy();
  return apiOk({
    shiftStart: policy.shiftStart,
    lateAfter: policy.lateAfter,
    lateThresholdMinutes: policy.lateThresholdMinutes,
    gpsCaptureEnabled: policy.gpsCaptureEnabled,
    halfday: policy.halfday,
  });
});
