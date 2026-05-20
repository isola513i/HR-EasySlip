import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { verifyCronAuth } from "@/lib/system/cron-auth";
import { resetYearEnd } from "@/lib/leave/leave-quota-grant-service";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

export const POST = withApiHandler(async (req) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const year = new Date().getFullYear() - 1; // reset previous year
  const result = await resetYearEnd(year);

  return apiOk(result);
});
