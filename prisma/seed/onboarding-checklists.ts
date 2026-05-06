// ════════════════════════════════════════════════════════════════
// Seed: per-employee OnboardingChecklist instances. Templates are
// seeded separately; this file walks every employee and ensures one
// checklist exists, copying items from the default template.
//
// We bypass createChecklistForEmployee() to avoid pulling the rest of
// the service layer (auth, env validation, etc.) into the seed
// runtime. The shape we write is identical to what the service
// produces — verified against lib/onboarding/checklist-service.ts.
//
// Idempotent: skips employees that already have a checklist.
// ════════════════════════════════════════════════════════════════

import type { PrismaClient } from "@prisma/client";
import type { EmployeeRecord } from "./employees";

export async function seedOnboardingChecklists(
  prisma: PrismaClient,
  employeeMap: Map<string, EmployeeRecord>,
): Promise<number> {
  const template = await prisma.onboardingTemplate.findFirst({
    where: { isDefault: true, isActive: true },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!template || template.items.length === 0) return 0;

  let created = 0;

  for (const emp of employeeMap.values()) {
    // unique constraint on employeeId means we can short-circuit here
    const existing = await prisma.onboardingChecklist.findUnique({
      where: { employeeId: emp.id },
    });
    if (existing) continue;

    // Pre-mark the first three items as done for one demo employee so
    // the progress bar isn't 0/N in screenshots. Everyone else starts
    // fresh, which is the realistic onboarding state.
    const isDemoCompleter = emp.code === "ES0011";

    await prisma.onboardingChecklist.create({
      data: {
        employeeId: emp.id,
        templateId: template.id,
        items: {
          create: template.items.map((item, idx) => ({
            title: item.title,
            description: item.description,
            category: item.category,
            sortOrder: item.sortOrder,
            isDone: isDemoCompleter && idx < 3,
            doneAt: isDemoCompleter && idx < 3 ? new Date("2026-01-15") : null,
            doneBy: isDemoCompleter && idx < 3 ? emp.userId : null,
          })),
        },
      },
    });
    created += 1;
  }

  return created;
}
