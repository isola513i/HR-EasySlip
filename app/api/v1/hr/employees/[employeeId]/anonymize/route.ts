import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiRoles } from "@/lib/security/rbac";
import { anonymizeEmployee } from "@/lib/employee/anonymization-service";

const ANONYMIZE_ROLES = ["HRMG", "ADMIN"] as const;

const AnonymizeConfirmSchema = z.object({
  confirm: z.literal(true, { message: "Must send { confirm: true } to proceed" }),
});

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiRoles(ANONYMIZE_ROLES);
  if (caller instanceof NextResponse) return caller;

  await parseBody(req, AnonymizeConfirmSchema);
  await anonymizeEmployee(caller.userId, ctx.params.employeeId, {
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return apiOk({ anonymized: true });
});
