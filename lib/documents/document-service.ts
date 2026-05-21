// ════════════════════════════════════════════════════════════════
// Generic document service
// Polymorphic on (entityType + entityId + category) so the same blob
// machinery serves contracts, leave attachments, time-correction proofs.
// All mutations write an audit log; reads are audited only when the
// caller is not the owner (high-volume self-reads kept clean).
// `blobPath` (Vercel Blob URL — public-by-knowledge) is NEVER returned
// to API callers. The /file proxy route is the only authorized read
// path so every byte fetch goes through RBAC + audit.
// ════════════════════════════════════════════════════════════════

import type { Document, Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
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
import { assertEntityBelongsToOwner, resolveEntityOwner } from "./entity-validation";

export {
  DOCUMENT_CATEGORIES,
  DOCUMENT_ENTITY_TYPES,
  type Caller,
  type DocumentCategory,
  type DocumentEntityType,
} from "./types";

// Public projection — strips blobPath so the Vercel Blob URL never leaks
// outside the service. API callers must use the /file proxy to read bytes.
export type PublicDocument = Omit<Document, "blobPath"> & { signedByMe?: boolean };
const publicView = ({ blobPath: _blobPath, ...rest }: Document): PublicDocument => rest;

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
  ipAddress?: string;
  userAgent?: string;
}

export async function uploadDocument(input: UploadInput): Promise<PublicDocument> {
  const { caller, ownerEmployeeId, category, entityType, entityId, file, ipAddress, userAgent } = input;

  if (!DOC_ALLOWED_MIME.includes(file.contentType as DocMime)) {
    throw new DomainError("UNSUPPORTED_MEDIA_TYPE", { mime: file.contentType }, 415);
  }
  if (!canWrite(caller, ownerEmployeeId, category)) {
    throw new DomainError("FORBIDDEN", {}, 403);
  }

  const prisma = await getPrisma();
  const owner = await prisma.employee.findUnique({
    where: { id: ownerEmployeeId },
    select: { id: true, isAnonymized: true },
  });
  if (!owner) throw new DomainError("EMPLOYEE_NOT_FOUND", {}, 404);
  if (owner.isAnonymized) throw new DomainError("EMPLOYEE_ANONYMIZED", {}, 410);

  await assertEntityBelongsToOwner(category, entityType, entityId, ownerEmployeeId);

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
      return publicView(doc);
    });
  } catch (err) {
    await deleteBlob(stored.url).catch(() => {});
    throw err;
  }
}

export async function deleteDocument(input: MutateInput): Promise<void> {
  const { caller, documentId, ipAddress, userAgent } = input;
  const prisma = await getPrisma();
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
  const prisma = await getPrisma();
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

export async function getDocument(input: MutateInput): Promise<PublicDocument> {
  const { caller, documentId, ipAddress, userAgent } = input;
  const prisma = await getPrisma();
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new DomainError("DOCUMENT_NOT_FOUND", {}, 404);
  if (!(await canRead(caller, doc))) throw new DomainError("FORBIDDEN", {}, 403);

  if (!isOwner(caller, doc.ownerEmployeeId)) {
    await writeAuditLog({
      actorId: caller.userId,
      action: "document.metadata_viewed",
      entityType: "Document",
      entityId: documentId,
      ipAddress,
      userAgent,
      reason: isHr(caller) ? "hr_access" : "manager_access",
    });
  }

  return publicView(doc);
}

interface ListByEntityInput {
  caller: Caller;
  entityType: DocumentEntityType;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * List documents attached to a specific entity (e.g. all attachments on a
 * single LeaveRequest). Used by manager DetailSheet + employee history view.
 *
 * Audited on non-owner reads — one entry per access event (not per doc), to
 * match streamDocument/getDocument PDPA semantics without bursting logs when
 * a manager opens an entity with multiple attachments.
 */
export async function listDocumentsByEntity(input: ListByEntityInput): Promise<PublicDocument[]> {
  const { caller, entityType, entityId, ipAddress, userAgent } = input;
  const prisma = await getPrisma();
  const ownerEmployeeId = await resolveEntityOwner(entityType, entityId);
  const owner = isOwner(caller, ownerEmployeeId);
  const hr = isHr(caller);
  const mgr = !owner && !hr ? await isManagerOfOwner(caller, ownerEmployeeId) : false;
  if (!owner && !hr && !mgr) throw new DomainError("FORBIDDEN", {}, 403);

  if (!owner) {
    await writeAuditLog({
      actorId: caller.userId,
      action: "document.list_viewed",
      entityType,
      entityId,
      ipAddress,
      userAgent,
      reason: hr ? "hr_access" : "manager_access",
    });
  }

  const docs = await prisma.document.findMany({
    where: { entityType, entityId },
    orderBy: { uploadedAt: "desc" },
  });
  return docs.map(publicView);
}

export async function listDocuments(input: ListInput): Promise<PublicDocument[]> {
  const { caller, ownerEmployeeId, category, ipAddress, userAgent } = input;
  const prisma = await getPrisma();
  const owner = isOwner(caller, ownerEmployeeId);
  const hr = isHr(caller);
  const mgr = !owner && !hr ? await isManagerOfOwner(caller, ownerEmployeeId) : false;
  if (!owner && !hr && !mgr) throw new DomainError("FORBIDDEN", {}, 403);

  if (!owner) {
    await writeAuditLog({
      actorId: caller.userId,
      action: "document.list_viewed",
      entityType: "Employee",
      entityId: ownerEmployeeId,
      ipAddress,
      userAgent,
      reason: hr ? "hr_access" : "manager_access",
    });
  }

  const docs = await prisma.document.findMany({
    where: {
      ownerEmployeeId,
      ...(category ? { category } : {}),
      // Manager can only see leave/time-correction proofs of their reports.
      ...(mgr ? { category: { in: ["leave_attachment", "time_correction_proof"] } } : {}),
    },
    orderBy: { uploadedAt: "desc" },
  });

  // Annotate signedByMe for documents that require signature
  const signatureRequired = docs.filter((d) => d.requiresSignature).map((d) => d.id);
  const mySignatures = signatureRequired.length > 0 && caller.employeeId
    ? await prisma.documentSignature.findMany({
        where: { documentId: { in: signatureRequired }, signerEmployeeId: caller.employeeId },
        select: { documentId: true },
      })
    : [];
  const signedSet = new Set(mySignatures.map((s) => s.documentId));

  return docs.map((d) => ({ ...publicView(d), signedByMe: signedSet.has(d.id) }));
}
