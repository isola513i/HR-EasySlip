import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { putBlob, deleteBlob, fetchBlob, IMAGE_ONLY_MIME, type ImageMime } from "@/lib/storage/blob";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError } from "@/lib/api/errors";
import type { ParsedFile } from "@/lib/api/parse-multipart";

export const PROFILE_PICTURE_MAX_BYTES = 3 * 1024 * 1024; // 3MB — avatars don't need 5MB
export const PROFILE_PICTURE_ALLOWED = IMAGE_ONLY_MIME;

interface UploadInput {
  actorUserId: string;
  employeeId: string;
  file: ParsedFile;
  ipAddress?: string;
  userAgent?: string;
}

export async function uploadProfilePicture(input: UploadInput) {
  const { actorUserId, employeeId, file, ipAddress, userAgent } = input;

  if (!PROFILE_PICTURE_ALLOWED.includes(file.contentType as ImageMime)) {
    throw new DomainError("UNSUPPORTED_MEDIA_TYPE", { mime: file.contentType }, 415);
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, profilePicturePath: true, isAnonymized: true },
  });
  if (!employee) throw new DomainError("EMPLOYEE_NOT_FOUND", {}, 404);
  if (employee.isAnonymized) throw new DomainError("EMPLOYEE_ANONYMIZED", {}, 410);

  const oldUrl = employee.profilePicturePath;
  const stored = await putBlob({
    pathPrefix: `profile-pictures/${employeeId}`,
    filename: file.filename,
    contentType: file.contentType,
    body: file.buffer,
  });

  const uploadedAt = new Date();
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.employee.update({
      where: { id: employeeId },
      data: {
        profilePicturePath: stored.url,
        profilePictureMime: file.contentType,
        profilePictureUploadedAt: uploadedAt,
      },
    });
    await writeAuditLog(
      {
        actorId: actorUserId,
        action: "employee.profile_picture_uploaded",
        entityType: "Employee",
        entityId: employeeId,
        before: oldUrl ? { url: oldUrl } : null,
        after: { url: stored.url, size: stored.size, mime: file.contentType },
        ipAddress,
        userAgent,
      },
      tx,
    );
  });

  if (oldUrl && oldUrl !== stored.url) {
    void deleteBlob(oldUrl).catch(() => {/* best-effort */});
  }

  return { uploadedAt, mime: file.contentType, size: stored.size };
}

interface DeleteInput {
  actorUserId: string;
  employeeId: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function deleteProfilePicture(input: DeleteInput) {
  const { actorUserId, employeeId, ipAddress, userAgent } = input;
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { profilePicturePath: true },
  });
  if (!employee?.profilePicturePath) return;

  const oldUrl = employee.profilePicturePath;
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.employee.update({
      where: { id: employeeId },
      data: {
        profilePicturePath: null,
        profilePictureMime: null,
        profilePictureUploadedAt: null,
      },
    });
    await writeAuditLog(
      {
        actorId: actorUserId,
        action: "employee.profile_picture_deleted",
        entityType: "Employee",
        entityId: employeeId,
        before: { url: oldUrl },
        after: null,
        ipAddress,
        userAgent,
      },
      tx,
    );
  });

  void deleteBlob(oldUrl).catch(() => {/* best-effort */});
}

export async function streamProfilePicture(employeeId: string) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { profilePicturePath: true, profilePictureMime: true },
  });
  if (!employee?.profilePicturePath) {
    throw new DomainError("PROFILE_PICTURE_NOT_FOUND", {}, 404);
  }
  const blob = await fetchBlob(employee.profilePicturePath);
  return {
    body: blob.body,
    contentType: employee.profilePictureMime ?? blob.contentType,
    size: blob.size,
  };
}
