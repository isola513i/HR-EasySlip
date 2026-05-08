import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { verifyCronAuth } from "@/lib/system/cron-auth";
import { dispatchToEmpeo } from "@/lib/integrations/empeo/empeo-dispatcher";

const handler = withApiHandler(async (req) => {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const result = await dispatchToEmpeo();
  return apiOk(result);
});

export const GET = handler;
export const POST = handler;
