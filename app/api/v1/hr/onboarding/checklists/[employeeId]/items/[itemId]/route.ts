import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, HR_ROLES } from "@/lib/security/rbac";
import { ChecklistItemToggleSchema } from "@/lib/onboarding/schemas";
import { toggleChecklistItem } from "@/lib/onboarding/checklist-service";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

export const PATCH = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const { isDone } = await parseBody(req, ChecklistItemToggleSchema);
  const result = await toggleChecklistItem({
    itemId: ctx.params.itemId,
    isDone,
    actorUserId: caller.userId,
    ownerEmployeeId: ctx.params.employeeId,
    meta: { ip: ctx.ip, userAgent: ctx.userAgent },
    skipOwnerCheck: true,
  });
  return apiOk(result);
});
