import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { buildOpenApiDocument } from "@/lib/api/openapi";

export const GET = withApiHandler(async () => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const spec = buildOpenApiDocument();
  return NextResponse.json(spec, {
    headers: { "Cache-Control": "private, max-age=3600" },
  });
});
