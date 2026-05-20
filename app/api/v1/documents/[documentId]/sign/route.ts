import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { signDocument } from "@/lib/documents/signature-service";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

const SignSchema = z.object({
  signatureDataUrl: z.string().min(64).max(220_000),
});

export const POST = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, SignSchema);
  const result = await signDocument({
    caller: { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    documentId: ctx.params.documentId,
    signatureDataUrl: input.signatureDataUrl,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return apiOk(result);
});
