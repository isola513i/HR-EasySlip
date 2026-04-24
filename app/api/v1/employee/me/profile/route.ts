import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { ProfileUpdateSchema } from "@/lib/employee/profile-schemas";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";

const PROFILE_SELECT = {
  id: true, employeeCode: true, firstNameTh: true, lastNameTh: true,
  firstNameEn: true, lastNameEn: true, phone: true, employmentStatus: true,
  department: { select: { name: true, code: true } },
  position: { select: { name: true } },
  user: { select: { email: true } },
} as const;

export const GET = withApiHandler(async () => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const profile = await prisma.employee.findUnique({
    where: { id: caller.employeeId },
    select: PROFILE_SELECT,
  });

  return apiOk(profile);
});

export const PUT = withApiHandler(async (req, ctx) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, ProfileUpdateSchema);

  const before = await prisma.employee.findUnique({
    where: { id: caller.employeeId },
    select: { phone: true, firstNameEn: true, lastNameEn: true },
  });

  const updated = await prisma.employee.update({
    where: { id: caller.employeeId },
    data: { phone: input.phone, firstNameEn: input.firstNameEn, lastNameEn: input.lastNameEn },
    select: PROFILE_SELECT,
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "employee.profile_updated",
    entityType: "Employee",
    entityId: caller.employeeId,
    before,
    after: input,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return apiOk(updated);
});
