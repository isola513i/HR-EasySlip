import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk, apiCreated } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiRoles } from "@/lib/security/rbac";
import { listTemplates, createTemplate } from "@/lib/reviews/template-service";
import { ReviewTemplateCreateSchema } from "@/lib/reviews/schemas";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

const HR_ROLES = ["HRMG", "HR_AUTHORIZED", "CEO", "CTO", "COO"] as const;

export const GET = withApiHandler(async () => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;
  return apiOk(await listTemplates());
});

export const POST = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;
  const input = await parseBody(req, ReviewTemplateCreateSchema);
  const result = await createTemplate(
    { userId: caller.userId, employeeId: caller.employeeId!, roles: caller.roles },
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );
  return apiCreated(result);
});
