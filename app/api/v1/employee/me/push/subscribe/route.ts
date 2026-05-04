import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { prisma } from "@/lib/prisma";
import { PushSubscribeSchema } from "@/lib/push/schemas";

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, PushSubscribeSchema);

  const sub = await prisma.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    create: {
      userId: caller.userId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: ctx.userAgent,
    },
    update: {
      userId: caller.userId,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      lastUsed: new Date(),
    },
  });

  return apiOk({ id: sub.id });
});
