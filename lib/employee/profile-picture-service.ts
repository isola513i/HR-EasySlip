import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { putBlob, deleteBlob, fetchBlob, IMAGE_ONLY_MIME, type ImageMime } from "@/lib/storage/blob";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError } from "@/lib/api/errors";
import type { Role } from "@prisma/client";
import { HR_ROLES } from "@/lib/security/rbac";
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

  const prisma = await getPrisma();
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
  // If the DB transaction fails after the blob is already in storage, the
  // new blob is orphaned (no row references it). Clean it up before rethrow.
  try {
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
  } catch (err) {
    await deleteBlob(stored.url).catch(() => {/* secondary cleanup failure swallowed */});
    throw err;
  }

  // Await: in serverless, fire-and-forget can be killed before the request
  // to Vercel Blob completes, leaving an orphan. ~100-200ms hit on response.
  if (oldUrl && oldUrl !== stored.url) {
    await deleteBlob(oldUrl).catch(() => {/* old blob may already be gone */});
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
  const prisma = await getPrisma();
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

  await deleteBlob(oldUrl).catch(() => {/* best-effort, blob may already be gone */});
}

interface StreamInput {
  employeeId: string;
  caller: {
    userId: string;
    employeeId: string | null | undefined;
    roles: readonly Role[];
  };
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Stream a profile picture with RBAC + PDPA audit.
 *
 * Authorization:
 *  - owner reads own picture: no audit (high-volume, expected access)
 *  - HR_ROLES (HR, CEO/CTO/COO/HRMG, ADMIN): audited
 *  - direct manager (caller.employeeId === target.managerId): audited
 *  - everyone else: 403 (no audit on denial — already in request log)
 */
export async function streamProfilePicture(input: StreamInput) {
  const { employeeId, caller, ipAddress, userAgent } = input;

  const prisma = await getPrisma();
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { profilePicturePath: true, profilePictureMime: true, managerId: true },
  });
  if (!employee?.profilePicturePath) {
    throw new DomainError("PROFILE_PICTURE_NOT_FOUND", {}, 404);
  }

  const isOwner = !!caller.employeeId && caller.employeeId === employeeId;
  const isHr = caller.roles.some((r) => HR_ROLES.includes(r));
  const isDirectManager = !!caller.employeeId && employee.managerId === caller.employeeId;
  if (!isOwner && !isHr && !isDirectManager) {
    throw new DomainError("FORBIDDEN", {}, 403);
  }

  if (!isOwner) {
    await writeAuditLog({
      actorId: caller.userId,
      action: "employee.profile_picture_viewed",
      entityType: "Employee",
      entityId: employeeId,
      ipAddress,
      userAgent,
      reason: isHr ? "hr_access" : "manager_access",
    });
  }

  const blob = await fetchBlob(employee.profilePicturePath);
  return {
    body: blob.body,
    contentType: employee.profilePictureMime ?? blob.contentType,
    size: blob.size,
  };
}
