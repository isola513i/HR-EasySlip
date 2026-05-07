import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles } from "@/lib/security/rbac";
import { getCycle } from "@/lib/reviews/cycle-service";

const HR_ROLES = ["HRMG", "HR_AUTHORIZED", "CEO", "CTO", "COO"] as const;

export const GET = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;
  return apiOk(await getCycle(ctx.params.id));
});
