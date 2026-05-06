import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk, apiError } from "@/lib/api/response";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { DomainError } from "@/lib/api/errors";
import {
  listDocumentsByEntity,
  DOCUMENT_ENTITY_TYPES,
  type DocumentEntityType,
} from "@/lib/documents/document-service";

export const GET = withApiHandler(async (req, ctx) => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const entityType = req.nextUrl.searchParams.get("entityType") as DocumentEntityType | null;
  const entityId = req.nextUrl.searchParams.get("entityId");

  if (!entityType || !DOCUMENT_ENTITY_TYPES.includes(entityType)) {
    return apiError("INVALID_PARAM", "invalid entityType", 400);
  }
  if (!entityId) return apiError("INVALID_PARAM", "entityId is required", 400);

  try {
    const docs = await listDocumentsByEntity({
      caller: { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
      entityType,
      entityId,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return apiOk(docs);
  } catch (err) {
    if (err instanceof DomainError && err.code === "ENTITY_NOT_FOUND") {
      return apiError("NOT_FOUND", "entity not found", 404);
    }
    if (err instanceof DomainError && err.code === "FORBIDDEN") {
      return apiError("FORBIDDEN", "not authorized", 403);
    }
    throw err;
  }
});
