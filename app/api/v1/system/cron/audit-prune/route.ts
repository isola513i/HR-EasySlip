import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { verifyCronAuth } from "@/lib/system/cron-auth";
import { pruneOldAuditLogs } from "@/lib/system/cron-service";

// Manual prune endpoint. Daily-quota cron also triggers prune weekly on
// Sundays so this route is normally only used for one-off ops.
const handler = withApiHandler(async (req) => {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const result = await pruneOldAuditLogs();
  return apiOk(result);
});

export const GET = handler;
export const POST = handler;
