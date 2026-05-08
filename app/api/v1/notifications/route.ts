import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { listNotifications, countUnread } from "@/lib/notifications/notification-service";

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get("unread") === "true";
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 8)));

  const [items, unreadCount] = await Promise.all([
    listNotifications(caller.userId, { unreadOnly, limit }),
    countUnread(caller.userId),
  ]);

  return apiOk({ items, unreadCount });
});
