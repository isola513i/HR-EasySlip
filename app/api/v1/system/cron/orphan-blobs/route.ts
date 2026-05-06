import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { verifyCronAuth } from "@/lib/system/cron-auth";
import { cleanupOrphanBlobs } from "@/lib/storage/orphan-blob-cleanup";

// Reclaims Vercel Blob storage from rows that were dropped without going
// through the service-level cleanup (e.g. anonymized employees, manual
// SQL fixes). Schedule defined in vercel.json — also exposed for one-off
// ops via POST.
const handler = withApiHandler(async (req) => {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const result = await cleanupOrphanBlobs();
  return apiOk(result);
});

export const GET = handler;
export const POST = handler;
