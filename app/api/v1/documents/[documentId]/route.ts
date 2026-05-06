import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk, apiError } from "@/lib/api/response";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { DomainError } from "@/lib/api/errors";
import { getDocument, deleteDocument } from "@/lib/documents/document-service";

export const GET = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;
  const documentId = ctx.params.documentId;
  if (!documentId) return apiError("INVALID_PARAM", "documentId is required", 400);

  try {
    const doc = await getDocument({
      caller: { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
      documentId,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return apiOk(doc);
  } catch (err) {
    if (err instanceof DomainError && err.code === "DOCUMENT_NOT_FOUND") {
      return apiError("NOT_FOUND", "document not found", 404);
    }
    if (err instanceof DomainError && err.code === "FORBIDDEN") {
      return apiError("FORBIDDEN", "not authorized", 403);
    }
    throw err;
  }
});

export const DELETE = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;
  const documentId = ctx.params.documentId;
  if (!documentId) return apiError("INVALID_PARAM", "documentId is required", 400);

  try {
    await deleteDocument({
      caller: { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
      documentId,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return apiOk({ ok: true });
  } catch (err) {
    if (err instanceof DomainError && err.code === "DOCUMENT_NOT_FOUND") {
      return apiError("NOT_FOUND", "document not found", 404);
    }
    if (err instanceof DomainError && err.code === "FORBIDDEN") {
      return apiError("FORBIDDEN", "not authorized", 403);
    }
    throw err;
  }
});
