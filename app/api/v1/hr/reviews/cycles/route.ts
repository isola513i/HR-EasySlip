import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk, apiCreated } from "@/lib/api/response";
import { parseBody, parseSearchParams } from "@/lib/api/validate";
import { requireApiRoles } from "@/lib/security/rbac";
import { listCycles, createCycle } from "@/lib/reviews/cycle-service";
import { ReviewCycleCreateSchema } from "@/lib/reviews/schemas";

const HR_ROLES = ["HRMG", "HR_AUTHORIZED", "CEO", "CTO", "COO"] as const;

const ListSchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]).optional(),
});

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;
  const { status } = parseSearchParams(req, ListSchema);
  return apiOk(await listCycles(status));
});

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;
  const input = await parseBody(req, ReviewCycleCreateSchema);
  const result = await createCycle(
    { userId: caller.userId, employeeId: caller.employeeId!, roles: caller.roles },
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );
  return apiCreated(result);
});
