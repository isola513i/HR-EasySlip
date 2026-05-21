import { getPrisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { Caller, RequestMeta } from "@/lib/api/types";
import type { TemplateCreateInput, TemplateUpdateInput } from "./schemas";

export async function createTemplate(input: TemplateCreateInput, caller: Caller, meta: RequestMeta) {
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.onboardingTemplate.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }

    const template = await tx.onboardingTemplate.create({
      data: {
        name: input.name,
        isDefault: input.isDefault ?? false,
        createdBy: caller.userId,
        items: {
          create: input.items.map((item, i) => ({
            title: item.title, description: item.description,
            category: item.category, sortOrder: item.sortOrder ?? i,
          })),
        },
      },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    await writeAuditLog({
      actorId: caller.userId, action: "onboarding.template.create",
      entityType: "OnboardingTemplate", entityId: template.id,
      after: template, ipAddress: meta.ip, userAgent: meta.userAgent,
    }, tx);

    return template;
  });
}

export async function updateTemplate(id: string, input: TemplateUpdateInput, caller: Caller, meta: RequestMeta) {
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const existing = await tx.onboardingTemplate.findUnique({ where: { id } });
    if (!existing) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);

    if (input.isDefault) {
      await tx.onboardingTemplate.updateMany({ where: { isDefault: true, id: { not: id } }, data: { isDefault: false } });
    }

    if (input.items) {
      await tx.onboardingTemplateItem.deleteMany({ where: { templateId: id } });
      await tx.onboardingTemplateItem.createMany({
        data: input.items.map((item, i) => ({
          templateId: id, title: item.title, description: item.description,
          category: item.category, sortOrder: item.sortOrder ?? i,
        })),
      });
    }

    const template = await tx.onboardingTemplate.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    await writeAuditLog({
      actorId: caller.userId, action: "onboarding.template.update",
      entityType: "OnboardingTemplate", entityId: id,
      before: existing, after: template, ipAddress: meta.ip, userAgent: meta.userAgent,
    }, tx);

    return template;
  });
}

export async function listTemplates() {
  const prisma = await getPrisma();
  return prisma.onboardingTemplate.findMany({
    where: { isActive: true },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTemplateById(id: string) {
  const prisma = await getPrisma();
  const template = await prisma.onboardingTemplate.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!template) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
  return template;
}

export async function deleteTemplate(id: string, caller: Caller, meta: RequestMeta) {
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const existing = await tx.onboardingTemplate.findUnique({ where: { id } });
    if (!existing) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);

    await tx.onboardingTemplate.update({ where: { id }, data: { isActive: false } });

    await writeAuditLog({
      actorId: caller.userId, action: "onboarding.template.delete",
      entityType: "OnboardingTemplate", entityId: id,
      before: existing, ipAddress: meta.ip, userAgent: meta.userAgent,
    }, tx);
  });
}
