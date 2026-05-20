import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiRoles } from "@/lib/security/rbac";
import { assignAsset } from "@/lib/assets/asset-service";
import { AssetAssignSchema } from "@/lib/assets/schemas";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

const ASSET_ROLES = ["HRMG", "HR_AUTHORIZED", "CEO", "CTO", "COO"] as const;

export const POST = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiRoles(ASSET_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, AssetAssignSchema);
  const result = await assignAsset(
    { userId: caller.userId, employeeId: caller.employeeId!, roles: caller.roles },
    ctx.params.id,
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );
  return apiOk(result);
});
