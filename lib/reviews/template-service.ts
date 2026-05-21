import { getPrisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { Caller, RequestMeta } from "@/lib/api/types";
import type { ReviewTemplateCreateInput } from "./schemas";

export async function listTemplates() {
  const prisma = await getPrisma();
  return prisma.reviewTemplate.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createTemplate(
  caller: Caller,
  input: ReviewTemplateCreateInput,
  meta: RequestMeta,
) {
  const prisma = await getPrisma();
  const created = await prisma.reviewTemplate.create({
    data: {
      name: input.name,
      questions: input.questions,
    },
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "review.template_created",
    entityType: "ReviewTemplate",
    entityId: created.id,
    after: created,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return created;
}

export async function getTemplate(id: string) {
  const prisma = await getPrisma();
  const tmpl = await prisma.reviewTemplate.findUnique({ where: { id } });
  if (!tmpl) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
  return tmpl;
}
