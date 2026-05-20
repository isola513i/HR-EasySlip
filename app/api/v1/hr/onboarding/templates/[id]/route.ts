import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, HR_ROLES } from "@/lib/security/rbac";
import { TemplateUpdateSchema } from "@/lib/onboarding/schemas";
import { getTemplateById, updateTemplate, deleteTemplate } from "@/lib/onboarding/template-service";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

export const GET = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;
  return apiOk(await getTemplateById(ctx.params.id));
});

export const PUT = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, TemplateUpdateSchema);
  const template = await updateTemplate(
    ctx.params.id,
    input,
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );
  return apiOk(template);
});

export const DELETE = withApiHandler(async (_req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  await deleteTemplate(
    ctx.params.id,
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );
  return apiOk({ deleted: true });
});
