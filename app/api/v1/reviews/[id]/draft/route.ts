import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { saveDraft } from "@/lib/reviews/review-service";
import { ReviewSaveDraftSchema } from "@/lib/reviews/schemas";

export const PATCH = withApiHandler(async (req, ctx) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;
  const input = await parseBody(req, ReviewSaveDraftSchema);
  const result = await saveDraft(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    ctx.params.id,
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );
  return apiOk(result);
});
