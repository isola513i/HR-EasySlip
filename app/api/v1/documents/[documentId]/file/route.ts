import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiError } from "@/lib/api/response";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { DomainError } from "@/lib/api/errors";
import { StorageError } from "@/lib/storage/blob";
import { streamDocument } from "@/lib/documents/document-service";

export const GET = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;
  const documentId = ctx.params.documentId;
  if (!documentId) return apiError("INVALID_PARAM", "documentId is required", 400);

  try {
    const blob = await streamDocument({
      caller: { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
      documentId,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return new NextResponse(blob.body, {
      status: 200,
      headers: {
        "Content-Type": blob.contentType,
        "Content-Length": String(blob.size || 0),
        "Content-Disposition": `inline; filename="${encodeURIComponent(blob.filename)}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    if (err instanceof DomainError && err.code === "DOCUMENT_NOT_FOUND") {
      return apiError("NOT_FOUND", "document not found", 404);
    }
    if (err instanceof DomainError && err.code === "FORBIDDEN") {
      return apiError("FORBIDDEN", "not authorized", 403);
    }
    if (err instanceof StorageError && err.code === "STORAGE_NOT_FOUND") {
      return apiError("NOT_FOUND", "blob not found", 404);
    }
    throw err;
  }
});
