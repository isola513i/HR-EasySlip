import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk, apiCreated } from "@/lib/api/response";
import { parseBody, parseSearchParams } from "@/lib/api/validate";
import { requireApiRoles } from "@/lib/security/rbac";
import { listAssets, createAsset } from "@/lib/assets/asset-service";
import { AssetCreateSchema, AssetListFiltersSchema } from "@/lib/assets/schemas";

const ASSET_ROLES = ["HRMG", "HR_AUTHORIZED", "CEO", "CTO", "COO"] as const;

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(ASSET_ROLES);
  if (caller instanceof NextResponse) return caller;

  const filters = parseSearchParams(req, AssetListFiltersSchema);
  const items = await listAssets(filters);
  return apiOk(items);
});

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiRoles(ASSET_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, AssetCreateSchema);
  const result = await createAsset(
    { userId: caller.userId, employeeId: caller.employeeId!, roles: caller.roles },
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );
  return apiCreated(result);
});
