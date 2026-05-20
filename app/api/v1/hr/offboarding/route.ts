import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk, apiCreated } from "@/lib/api/response";
import { parseBody, parseSearchParams } from "@/lib/api/validate";
import { requireApiRoles } from "@/lib/security/rbac";
import { listOffboarding, startOffboarding } from "@/lib/offboarding/offboarding-service";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

const HR_ROLES = ["HRMG", "HR_AUTHORIZED", "CEO", "CTO", "COO"] as const;

const StartSchema = z.object({
  employeeId: z.string().min(1),
  reason: z.enum(["RESIGNATION", "TERMINATION", "RETIREMENT", "CONTRACT_END"]),
  lastDay: z.string().date(),
  notes: z.string().max(2000).optional(),
});

const ListSchema = z.object({
  status: z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
});

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;
  const { status } = parseSearchParams(req, ListSchema);
  return apiOk(await listOffboarding(status));
});

export const POST = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;
  const input = await parseBody(req, StartSchema);
  const result = await startOffboarding(
    { userId: caller.userId, employeeId: caller.employeeId!, roles: caller.roles },
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );
  return apiCreated(result);
});
