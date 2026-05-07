import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { Caller } from "./types";

interface SignDocumentInput {
  caller: Caller;
  documentId: string;
  signatureDataUrl: string;
  ipAddress?: string;
  userAgent?: string;
}

const DATA_URL_PNG = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;
const MAX_DATA_URL_LEN = 200_000; // ~150KB png — generous

export async function signDocument({
  caller, documentId, signatureDataUrl, ipAddress, userAgent,
}: SignDocumentInput) {
  if (!DATA_URL_PNG.test(signatureDataUrl) || signatureDataUrl.length > MAX_DATA_URL_LEN) {
    throw new DomainError("INVALID_SIGNATURE", { message: "Signature must be a PNG data URL under 150KB" });
  }

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, ownerEmployeeId: true, requiresSignature: true },
  });
  if (!doc) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);

  // Only the owner can sign their own documents (signature = consent/acknowledgement)
  if (!caller.employeeId || doc.ownerEmployeeId !== caller.employeeId) {
    throw new DomainError("FORBIDDEN", { message: "Only the document owner can sign" }, 403);
  }
  const signerEmployeeId = caller.employeeId;

  const existing = await prisma.documentSignature.findUnique({
    where: { documentId_signerEmployeeId: { documentId, signerEmployeeId } },
  });
  if (existing) {
    throw new DomainError(ErrorCodes.ALREADY_PROCESSED, { message: "Document already signed" });
  }

  const signature = await prisma.$transaction(async (tx) => {
    const created = await tx.documentSignature.create({
      data: {
        documentId,
        signerEmployeeId,
        signatureDataUrl,
        ipAddress: ipAddress ?? null,
      },
    });

    await writeAuditLog({
      actorId: caller.userId,
      action: "document.signed",
      entityType: "Document",
      entityId: documentId,
      after: { signatureId: created.id },
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
    }, tx);

    return created;
  });

  return { id: signature.id, signedAt: signature.signedAt };
}

export async function getDocumentSignatures(documentId: string) {
  return prisma.documentSignature.findMany({
    where: { documentId },
    select: {
      id: true,
      signedAt: true,
      ipAddress: true,
      signer: {
        select: { id: true, employeeCode: true, firstNameTh: true, lastNameTh: true },
      },
    },
    orderBy: { signedAt: "asc" },
  });
}

export async function hasSignedDocument(documentId: string, employeeId: string): Promise<boolean> {
  const sig = await prisma.documentSignature.findUnique({
    where: { documentId_signerEmployeeId: { documentId, signerEmployeeId: employeeId } },
    select: { id: true },
  });
  return !!sig;
}
