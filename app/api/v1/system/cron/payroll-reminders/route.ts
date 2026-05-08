import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { verifyCronAuth } from "@/lib/system/cron-auth";
import { runPayrollReminders } from "@/lib/system/payroll-reminders-service";

const handler = withApiHandler(async (req) => {
  const authError = verifyCronAuth(req);
  if (authError) return authError;
  const result = await runPayrollReminders();
  return apiOk(result);
});

export const GET = handler;
export const POST = handler;
