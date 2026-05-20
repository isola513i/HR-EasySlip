import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { SettingResetSchema } from "@/lib/settings/schemas";
import { resetSettingToDefault } from "@/lib/settings/settings-service";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

export const POST = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, SettingResetSchema);
  const updated = await resetSettingToDefault(input.key, caller.userId, {
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
  return apiOk(updated);
});
