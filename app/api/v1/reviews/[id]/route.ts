import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { getReview } from "@/lib/reviews/review-service";

export const GET = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;
  const review = await getReview(ctx.params.id, {
    userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles,
  });
  return apiOk(review);
});
