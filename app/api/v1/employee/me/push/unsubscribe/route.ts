import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { prisma } from "@/lib/prisma";
import { PushUnsubscribeSchema } from "@/lib/push/schemas";

export const POST = withApiHandler(async (req) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, PushUnsubscribeSchema);

  await prisma.pushSubscription.deleteMany({
    where: { endpoint: input.endpoint, userId: caller.userId },
  });

  return apiOk({ ok: true });
});
