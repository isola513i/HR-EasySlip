import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError } from "@/lib/api/errors";
import type { RequestMeta } from "@/lib/api/types";

const ELIGIBLE_STATUSES = ["TERMINATED", "RESIGNED"] as const;

/**
 * PDPA Article 33: Right to Erasure.
 * Pseudonymize PII fields and delete linked User account.
 * Keeps structural data (employeeCode, hireDate, roles) for payroll/audit.
 */
export async function anonymizeEmployee(
  actorId: string,
  employeeId: string,
  meta: RequestMeta,
): Promise<void> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: { select: { id: true } } },
  });

  if (!employee) {
    throw new DomainError("EMPLOYEE_NOT_FOUND", {}, 404);
  }
  if (!(ELIGIBLE_STATUSES as readonly string[]).includes(employee.employmentStatus)) {
    throw new DomainError("NOT_ELIGIBLE_FOR_ANONYMIZATION", {
      message: "Only TERMINATED or RESIGNED employees can be anonymized",
      current: employee.employmentStatus,
    }, 400);
  }
  if (employee.isAnonymized) {
    throw new DomainError("ALREADY_ANONYMIZED", {
      anonymizedAt: employee.anonymizedAt,
    }, 409);
  }

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id: employeeId },
      data: {
        firstNameTh: "[anonymized]", lastNameTh: "[anonymized]",
        firstNameEn: null, lastNameEn: null, nicknameTh: null, nicknameEn: null,
        prefix: null, gender: null, nationalId: null, phone: null,
        personalEmail: null, lineId: null, dateOfBirth: null,
        nationality: null, ethnicity: null, religion: null,
        maritalStatus: null, militaryStatus: null, bloodType: null,
        socialSecurityNo: null, hospitalCode: null,
        profilePicturePath: null, profilePictureMime: null, profilePictureUploadedAt: null,
        addressRegistered: null, provinceRegistered: null, districtRegistered: null,
        subdistrictRegistered: null, zipCodeRegistered: null,
        addressCurrent: null, provinceCurrent: null, districtCurrent: null,
        subdistrictCurrent: null, zipCodeCurrent: null,
        emergencyName: null, emergencyLastName: null, emergencyRelation: null, emergencyPhone: null,
        isAnonymized: true, anonymizedAt: new Date(),
      },
    });

    await tx.user.delete({ where: { id: employee.userId } });

    await writeAuditLog({
      actorId,
      action: "employee.anonymized",
      entityType: "Employee",
      entityId: employeeId,
      before: { employeeId, employeeCode: employee.employeeCode },
      after: { anonymizedAt: new Date() },
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);
  }, { isolationLevel: "Serializable" });
}
