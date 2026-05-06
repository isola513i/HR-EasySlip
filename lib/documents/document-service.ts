// ════════════════════════════════════════════════════════════════
// Generic document service
// Polymorphic on (entityType + entityId + category) so the same blob
// machinery serves contracts, leave attachments, time-correction proofs.
// All mutations write an audit log; reads are audited only when the
// caller is not the owner (high-volume self-reads kept clean).
// ════════════════════════════════════════════════════════════════

import type { Document, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { putBlob, deleteBlob, fetchBlob, DOC_ALLOWED_MIME, type DocMime } from "@/lib/storage/blob";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError } from "@/lib/api/errors";
import type { ParsedFile } from "@/lib/api/parse-multipart";
import {
  type Caller,
  type DocumentCategory,
  type DocumentEntityType,
} from "./types";
import { canRead, canWrite, isHr, isManagerOfOwner, isOwner } from "./rbac";

export {
  DOCUMENT_CATEGORIES,
  DOCUMENT_ENTITY_TYPES,
  type Caller,
  type DocumentCategory,
  type DocumentEntityType,
} from "./types";

interface UploadInput {
  caller: Caller;
  ownerEmployeeId: string;
  category: DocumentCategory;
  entityType: DocumentEntityType;
  entityId: string;
  file: ParsedFile;
  ipAddress?: string;
  userAgent?: string;
}

interface MutateInput {
  caller: Caller;
  documentId: string;
  ipAddress?: string;
  userAgent?: string;
}

interface ListInput {
  caller: Caller;
  ownerEmployeeId: string;
  category?: DocumentCategory;
}

export async function uploadDocument(input: UploadInput): Promise<Document> {
  const { caller, ownerEmployeeId, category, entityType, entityId, file, ipAddress, userAgent } = input;

  if (!DOC_ALLOWED_MIME.includes(file.contentType as DocMime)) {
    throw new DomainError("UNSUPPORTED_MEDIA_TYPE", { mime: file.contentType }, 415);
  }
  if (!canWrite(caller, ownerEmployeeId, category)) {
    throw new DomainError("FORBIDDEN", {}, 403);
  }

  const owner = await prisma.employee.findUnique({
    where: { id: ownerEmployeeId },
    select: { id: true, isAnonymized: true },
  });
  if (!owner) throw new DomainError("EMPLOYEE_NOT_FOUND", {}, 404);
  if (owner.isAnonymized) throw new DomainError("EMPLOYEE_ANONYMIZED", {}, 410);

  const stored = await putBlob({
    pathPrefix: `documents/${ownerEmployeeId}/${category}`,
    filename: file.filename,
    contentType: file.contentType,
    body: file.buffer,
  });

  try {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const doc = await tx.document.create({
        data: {
          ownerEmployeeId,
          category,
          entityType,
          entityId,
          blobPath: stored.url,
          filename: file.filename,
          mime: file.contentType,
          size: stored.size,
          uploadedById: caller.userId,
        },
      });
      await writeAuditLog(
        {
          actorId: caller.userId,
          action: "document.uploaded",
          entityType: "Document",
          entityId: doc.id,
          after: { category, entityType, entityId, mime: file.contentType, size: stored.size },
          ipAddress,
          userAgent,
        },
        tx,
      );
      return doc;
    });
  } catch (err) {
    await deleteBlob(stored.url).catch(() => {});
    throw err;
  }
}

export async function deleteDocument(input: MutateInput): Promise<void> {
  const { caller, documentId, ipAddress, userAgent } = input;
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new DomainError("DOCUMENT_NOT_FOUND", {}, 404);
  if (!canWrite(caller, doc.ownerEmployeeId, doc.category as DocumentCategory)) {
    throw new DomainError("FORBIDDEN", {}, 403);
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.document.delete({ where: { id: documentId } });
    await writeAuditLog(
      {
        actorId: caller.userId,
        action: "document.deleted",
        entityType: "Document",
        entityId: documentId,
        before: { category: doc.category, entityType: doc.entityType, entityId: doc.entityId, filename: doc.filename },
        ipAddress,
        userAgent,
      },
      tx,
    );
  });

  await deleteBlob(doc.blobPath).catch(() => {});
}

export async function streamDocument(input: MutateInput) {
  const { caller, documentId, ipAddress, userAgent } = input;
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new DomainError("DOCUMENT_NOT_FOUND", {}, 404);
  if (!(await canRead(caller, doc))) throw new DomainError("FORBIDDEN", {}, 403);

  if (!isOwner(caller, doc.ownerEmployeeId)) {
    await writeAuditLog({
      actorId: caller.userId,
      action: "document.viewed",
      entityType: "Document",
      entityId: documentId,
      ipAddress,
      userAgent,
      reason: isHr(caller) ? "hr_access" : "manager_access",
    });
  }

  const blob = await fetchBlob(doc.blobPath);
  return {
    body: blob.body,
    contentType: doc.mime || blob.contentType,
    size: doc.size || blob.size,
    filename: doc.filename,
  };
}

export async function getDocument(input: { caller: Caller; documentId: string }): Promise<Document> {
  const doc = await prisma.document.findUnique({ where: { id: input.documentId } });
  if (!doc) throw new DomainError("DOCUMENT_NOT_FOUND", {}, 404);
  if (!(await canRead(input.caller, doc))) throw new DomainError("FORBIDDEN", {}, 403);
  return doc;
}

export async function listDocuments(input: ListInput): Promise<Document[]> {
  const { caller, ownerEmployeeId, category } = input;
  const owner = isOwner(caller, ownerEmployeeId);
  const hr = isHr(caller);
  const mgr = !owner && !hr ? await isManagerOfOwner(caller, ownerEmployeeId) : false;
  if (!owner && !hr && !mgr) throw new DomainError("FORBIDDEN", {}, 403);

  return prisma.document.findMany({
    where: {
      ownerEmployeeId,
      ...(category ? { category } : {}),
      // Manager can only see leave/time-correction proofs of their reports.
      ...(mgr ? { category: { in: ["leave_attachment", "time_correction_proof"] } } : {}),
    },
    orderBy: { uploadedAt: "desc" },
  });
}
