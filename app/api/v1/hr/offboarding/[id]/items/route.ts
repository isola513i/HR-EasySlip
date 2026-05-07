import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiRoles } from "@/lib/security/rbac";
import { toggleItem } from "@/lib/offboarding/offboarding-service";

const HR_ROLES = ["HRMG", "HR_AUTHORIZED", "CEO", "CTO", "COO"] as const;

const ToggleSchema = z.object({
  itemKey: z.string().min(1).max(64),
  completed: z.boolean(),
});

export const PATCH = withApiHandler(async (req, ctx) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;
  const input = await parseBody(req, ToggleSchema);
  const result = await toggleItem(
    { userId: caller.userId, employeeId: caller.employeeId!, roles: caller.roles },
    ctx.params.id,
    input.itemKey,
    input.completed,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );
  return apiOk(result);
});
