import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { verifyCronAuth } from "@/lib/system/cron-auth";
import { cleanupOrphanBlobs } from "@/lib/storage/orphan-blob-cleanup";
import { getControlPlane } from "@/lib/db/control-plane";
import { getTenantPrisma } from "@/lib/db/tenant";
import { runWithTenantContext } from "@/lib/db/tenant-context";

// Reclaims Vercel Blob storage from rows that were dropped without going
// through the service-level cleanup (e.g. anonymized employees, manual
// SQL fixes). Schedule defined in vercel.json — also exposed for one-off
// ops via POST. Pass ?dryRun=1 to skip deletion and only log candidates.
const handler = withApiHandler(async (req) => {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";

  const cp = getControlPlane();
  const tenants = await cp.tenant.findMany({
    where: { status: { in: ["TRIAL", "ACTIVE"] } },
    select: { id: true },
  });
  const results: Array<{ tenantId: string; result: Awaited<ReturnType<typeof cleanupOrphanBlobs>> | { error: string } }> = [];
  for (const t of tenants) {
    try {
      const result = await runWithTenantContext(t.id, async () => {
        const tp = await getTenantPrisma(t.id);
        return cleanupOrphanBlobs(tp, { dryRun });
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
