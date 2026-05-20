import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk, apiCreated } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, HR_ROLES } from "@/lib/security/rbac";
import { TemplateCreateSchema } from "@/lib/onboarding/schemas";
import { listTemplates, createTemplate } from "@/lib/onboarding/template-service";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

export const GET = withApiHandler(async () => {
  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;
  return apiOk(await listTemplates());
});

export const POST = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, TemplateCreateSchema);
  const template = await createTemplate(
    input,
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );
  return apiCreated(template);
});
