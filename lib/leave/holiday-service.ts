import { getPrisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { HolidayCreateInput, HolidayUpdateInput } from "./holiday-schemas";

export async function listHolidays(year?: number) {
  const prisma = await getPrisma();
  return prisma.publicHoliday.findMany({
    where: year ? { year } : undefined,
    orderBy: { date: "asc" },
  });
}

export async function createHoliday(input: HolidayCreateInput, userId: string) {
  const date = new Date(input.date);
  const year = date.getFullYear();
  const prisma = await getPrisma();

  const holiday = await prisma.publicHoliday.create({
    data: {
      date,
      year,
      name: input.name,
      nameEn: input.nameEn,
      isSubstituted: input.isSubstituted ?? false,
      color: input.color ?? "red",
      createdBy: userId,
    },
  });

  await writeAuditLog({
    actorId: userId,
    action: "holiday.create",
    entityType: "PublicHoliday",
    entityId: holiday.id,
    after: holiday,
  });

  return holiday;
}

export async function updateHoliday(
  id: string,
  input: HolidayUpdateInput,
  userId: string,
) {
  const prisma = await getPrisma();
  const existing = await prisma.publicHoliday.findUnique({ where: { id } });
  if (!existing) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);

  const data: Record<string, unknown> = {};
  if (input.date) {
    const d = new Date(input.date);
    data.date = d;
    data.year = d.getFullYear();
  }
  if (input.name !== undefined) data.name = input.name;
  if (input.nameEn !== undefined) data.nameEn = input.nameEn;
  if (input.isSubstituted !== undefined) data.isSubstituted = input.isSubstituted;
  if (input.color !== undefined) data.color = input.color;

  const updated = await prisma.publicHoliday.update({ where: { id }, data });

  await writeAuditLog({
    actorId: userId,
    action: "holiday.update",
    entityType: "PublicHoliday",
    entityId: id,
    before: existing,
    after: updated,
  });

  return updated;
}

export async function deleteHoliday(id: string, userId: string) {
  const prisma = await getPrisma();
  const existing = await prisma.publicHoliday.findUnique({ where: { id } });
  if (!existing) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);

  await prisma.publicHoliday.delete({ where: { id } });

  await writeAuditLog({
    actorId: userId,
    action: "holiday.delete",
    entityType: "PublicHoliday",
    entityId: id,
    before: existing,
  });
}
