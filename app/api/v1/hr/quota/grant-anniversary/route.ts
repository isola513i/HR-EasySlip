import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { verifyCronAuth } from "@/lib/system/cron-auth";
import { grantAnniversaryLeave } from "@/lib/leave/leave-quota-grant-service";

export const POST = withApiHandler(async (req) => {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const result = await grantAnniversaryLeave();
  return apiOk(result);
});
