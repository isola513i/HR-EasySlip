import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk, apiError } from "@/lib/api/response";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import {
  listDocuments,
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
} from "@/lib/documents/document-service";

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const categoryParam = req.nextUrl.searchParams.get("category") ?? undefined;
  if (categoryParam && !DOCUMENT_CATEGORIES.includes(categoryParam as DocumentCategory)) {
    return apiError("INVALID_PARAM", "invalid category", 400);
  }

  const docs = await listDocuments({
    caller: { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    ownerEmployeeId: caller.employeeId,
    category: categoryParam as DocumentCategory | undefined,
  });
  return apiOk(docs);
});
