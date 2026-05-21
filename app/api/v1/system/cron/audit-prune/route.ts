import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { verifyCronAuth } from "@/lib/system/cron-auth";
import { pruneOldAuditLogs } from "@/lib/system/cron-service";
import { getControlPlane } from "@/lib/db/control-plane";
import { getTenantPrisma } from "@/lib/db/tenant";
import { runWithTenantContext } from "@/lib/db/tenant-context";

// Manual prune endpoint. Daily-quota cron also triggers prune weekly on
// Sundays so this route is normally only used for one-off ops.
const handler = withApiHandler(async (req) => {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const cp = getControlPlane();
  const tenants = await cp.tenant.findMany({
    where: { status: { in: ["TRIAL", "ACTIVE"] } },
    select: { id: true },
  });
  const results: Array<{ tenantId: string; result: Awaited<ReturnType<typeof pruneOldAuditLogs>> | { error: string } }> = [];
  for (const t of tenants) {
    try {
      const result = await runWithTenantContext(t.id, async () => {
        const tp = await getTenantPrisma(t.id);
        return pruneOldAuditLogs(tp);
      });
      results.push({ tenantId: t.id, result });
    } catch (err) {
      results.push({ tenantId: t.id, result: { error: err instanceof Error ? err.message : String(err) } });
    }
  }
  return apiOk({ tenants: results.length, results });
});

export const GET = handler;
export const POST = handler;
