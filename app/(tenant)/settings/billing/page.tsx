import { getControlPlane } from "@/lib/db/control-plane";
import { getTenantId } from "@/lib/db/tenant-context";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { TENANT_STATUS_VARIANT } from "@/lib/security/platform-status-variants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function daysRemaining(date: Date): number {
  const now = new Date();
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 86_400_000));
}

export default async function BillingPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const tb = t.tenantSettings.billing;

  const tenantId = await getTenantId();
  const cp = getControlPlane();

  const tenant = await cp.tenant.findUnique({
    where: { id: tenantId },
    select: { status: true, trialEndsAt: true, planCode: true, companyName: true },
  });

  if (!tenant) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">{tb.title}</h1>
          <p className="text-sm text-muted-foreground">{tb.subtitle}</p>
        </div>
        <p className="text-sm text-muted-foreground">{tb.noData}</p>
      </div>
    );
  }

  const isActive = tenant.status === "ACTIVE";
  const isTrial = tenant.status === "TRIAL";
  const isExpired = tenant.status === "TRIAL_EXPIRED";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{tb.title}</h1>
        <p className="text-sm text-muted-foreground">{tb.subtitle}</p>
      </div>

      <div className="grid gap-4 max-w-lg">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{tb.plan}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{tb.plan}</span>
              <span className="font-medium">{tenant.planCode ?? "Trial"}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{tb.status}</span>
              <Badge variant={TENANT_STATUS_VARIANT[tenant.status] ?? "outline"}>
                {tenant.status}
              </Badge>
            </div>

            {isTrial && tenant.trialEndsAt && (
              <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{tb.trialEnds}</span>
                  <span className="font-medium">
                    {new Date(tenant.trialEndsAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-yellow-700">
                  {daysRemaining(new Date(tenant.trialEndsAt))} {tb.daysLeft}
                </p>
              </div>
            )}

            {isExpired && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 space-y-2">
                <p className="text-sm font-medium text-red-700">{tb.expired}</p>
                <a
                  href="mailto:sales@easyslip.app"
                  className="text-sm text-red-600 underline underline-offset-4"
                >
                  {tb.upgrade}
                </a>
              </div>
            )}

            {isActive && (
              <div className="rounded-md bg-green-50 border border-green-200 p-3">
                <p className="text-sm font-medium text-green-700">{tb.active}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
