import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { submitReview } from "@/lib/reviews/review-service";
import { ReviewSubmitSchema } from "@/lib/reviews/schemas";

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;
  const input = await parseBody(req, ReviewSubmitSchema);
  const result = await submitReview(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    ctx.params.id,
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );
  return apiOk(result);
});
