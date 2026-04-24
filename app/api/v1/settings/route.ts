import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { SettingUpdateSchema } from "@/lib/settings/schemas";
import { listSettings, updateSetting } from "@/lib/settings/settings-service";

export const GET = withApiHandler(async () => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const settings = await listSettings();
  return apiOk(settings);
});

export const PUT = withApiHandler(async (req, ctx) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, SettingUpdateSchema);
  const updated = await updateSetting(input, caller.userId, {
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
  return apiOk(updated);
});
