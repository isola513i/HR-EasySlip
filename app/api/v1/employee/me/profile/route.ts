import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk, apiError } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { ProfileUpdateSchema } from "@/lib/employee/profile-schemas";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";

const PROFILE_SELECT = {
  id: true, employeeCode: true, firstNameTh: true, lastNameTh: true,
  firstNameEn: true, lastNameEn: true, phone: true, employmentStatus: true,
  nicknameTh: true, nicknameEn: true, dateOfBirth: true,
  nationality: true, religion: true, maritalStatus: true, bloodType: true,
  addressCurrent: true, provinceCurrent: true, districtCurrent: true, zipCodeCurrent: true,
  emergencyName: true, emergencyLastName: true, emergencyRelation: true, emergencyPhone: true,
  profilePicturePath: true, profilePictureUploadedAt: true,
  department: { select: { name: true, code: true } },
  position: { select: { name: true } },
  user: { select: { email: true } },
} as const;

function shapeProfile(row: { profilePicturePath: string | null } & Record<string, unknown>) {
  const { profilePicturePath, ...rest } = row;
  return { ...rest, hasProfilePicture: profilePicturePath !== null };
}

export const GET = withApiHandler(async () => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const profile = await prisma.employee.findUnique({
    where: { id: caller.employeeId },
    select: PROFILE_SELECT,
  });
  if (!profile) return apiError("EMPLOYEE_NOT_FOUND", "profile missing", 404);

  return apiOk(shapeProfile(profile));
});

export const PUT = withApiHandler(async (req, ctx) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, ProfileUpdateSchema);

  const before = await prisma.employee.findUnique({
    where: { id: caller.employeeId },
    select: {
      phone: true, firstNameEn: true, lastNameEn: true,
      nicknameTh: true, nicknameEn: true, dateOfBirth: true,
      nationality: true, religion: true, maritalStatus: true, bloodType: true,
      addressCurrent: true, provinceCurrent: true, districtCurrent: true, zipCodeCurrent: true,
      emergencyName: true, emergencyLastName: true, emergencyRelation: true, emergencyPhone: true,
    },
  });

  const updated = await prisma.employee.update({
    where: { id: caller.employeeId },
    data: {
      phone: input.phone, firstNameEn: input.firstNameEn, lastNameEn: input.lastNameEn,
      nicknameTh: input.nicknameTh, nicknameEn: input.nicknameEn,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      nationality: input.nationality, religion: input.religion,
      maritalStatus: input.maritalStatus, bloodType: input.bloodType,
      addressCurrent: input.addressCurrent, provinceCurrent: input.provinceCurrent,
      districtCurrent: input.districtCurrent, zipCodeCurrent: input.zipCodeCurrent,
      emergencyName: input.emergencyName, emergencyLastName: input.emergencyLastName,
      emergencyRelation: input.emergencyRelation, emergencyPhone: input.emergencyPhone,
    },
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

  return apiOk(shapeProfile(updated));
});
