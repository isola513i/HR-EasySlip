import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { verifyCronAuth } from "@/lib/system/cron-auth";
import { dailyQuotaTick } from "@/lib/system/cron-service";

const handler = withApiHandler(async (req) => {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const result = await dailyQuotaTick();
  return apiOk(result);
});

// Vercel Cron sends GET with `Authorization: Bearer ${CRON_SECRET}`. POST
// retained so manual ops triggers (curl) can keep using the same path.
export const GET = handler;
export const POST = handler;
