import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiCreated, apiError } from "@/lib/api/response";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { parseMultipart } from "@/lib/api/parse-multipart";
import { DOC_ALLOWED_MIME, DOC_MAX_BYTES, StorageError } from "@/lib/storage/blob";
import { DomainError } from "@/lib/api/errors";
import {
  uploadDocument,
  DOCUMENT_CATEGORIES,
  DOCUMENT_ENTITY_TYPES,
  type DocumentCategory,
  type DocumentEntityType,
} from "@/lib/documents/document-service";

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const { fields, file } = await parseMultipart(req, {
    fileField: "file",
    requireFile: true,
    maxBytes: DOC_MAX_BYTES,
    allowedMime: DOC_ALLOWED_MIME,
    textFields: ["category", "entityType", "entityId", "ownerEmployeeId"],
  });

  const category = fields.category as DocumentCategory | undefined;
  const entityType = fields.entityType as DocumentEntityType | undefined;
  const entityId = fields.entityId;
  const ownerEmployeeId = fields.ownerEmployeeId || caller.employeeId;

  if (!category || !DOCUMENT_CATEGORIES.includes(category)) {
    return apiError("INVALID_PARAM", "invalid category", 400);
  }
  if (!entityType || !DOCUMENT_ENTITY_TYPES.includes(entityType)) {
    return apiError("INVALID_PARAM", "invalid entityType", 400);
  }
  if (!entityId) return apiError("INVALID_PARAM", "entityId is required", 400);
  if (!ownerEmployeeId) return apiError("INVALID_PARAM", "ownerEmployeeId is required", 400);

  try {
    const doc = await uploadDocument({
      caller: { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
      ownerEmployeeId,
      category,
      entityType,
      entityId,
      file: file!,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return apiCreated(doc);
  } catch (err) {
    if (err instanceof DomainError && err.code === "FORBIDDEN") {
      return apiError("FORBIDDEN", "not authorized to upload", 403);
    }
    if (err instanceof StorageError) {
      return apiError("STORAGE_ERROR", err.message, 502);
    }
    throw err;
  }
});
