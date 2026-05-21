import { requirePlatformSession } from "@/lib/auth/platform";
import { getControlPlane } from "@/lib/db/control-plane";
import { PLATFORM_VIEWER_ROLES, PLATFORM_ADMIN_ROLES } from "@/lib/security/platform-rbac";
import { getPlans } from "@/lib/platform/plan-catalog";
import { PageHeader } from "@/components/platform/page-header";
import { PlanFormDialog } from "./plan-form-dialog";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export const metadata = { title: "Plans — EasySlip Platform" };

export default async function PlatformPlansPage() {
  const session = await requirePlatformSession(PLATFORM_VIEWER_ROLES);
  const isAdmin = PLATFORM_ADMIN_ROLES.includes(session.role);
  const cp = getControlPlane();

  const [activeTenants, plans] = await Promise.all([
    cp.tenant.findMany({
      where: { status: { in: ["ACTIVE", "TRIAL"] } },
      select: { planCode: true },
    }),
    getPlans(),
  ]);

  const countMap: Record<string, number> = {};
  for (const t of activeTenants) {
    const key = t.planCode ?? "none";
    countMap[key] = (countMap[key] ?? 0) + 1;
  }

  const unassigned = countMap["none"] ?? 0;
  const nextSortOrder = plans.length;

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-8">
        <PageHeader
          title="Plans"
          subtitle="Subscription tiers and active tenant distribution."
        />
        {isAdmin && <PlanFormDialog mode="create" nextSortOrder={nextSortOrder} />}
      </div>

      {unassigned > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="size-4 text-amber-400 shrink-0" />
            <span className="text-sm text-amber-300">
              {unassigned} tenant{unassigned !== 1 ? "s" : ""} with no plan assigned
            </span>
          </div>
          <Link
            href="/platform/tenants?plan=__none__"
            className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
          >
            View tenants →
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => {
          const count = countMap[plan.code] ?? 0;
          return (
            <div
              key={plan.code}
              className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{plan.name}</h3>
                  {plan.priceTHB !== null ? (
                    <p className="text-muted-foreground text-sm mt-0.5">
                      ฿{plan.priceTHB.toLocaleString()}
                      <span className="text-muted-foreground/50">/mo</span>
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm mt-0.5">Custom pricing</p>
                  )}
                </div>
                <Link
                  href={`/platform/tenants?plan=${plan.code}`}
                  className="text-xs tabular-nums text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
                >
                  {count} {count === 1 ? "tenant" : "tenants"}
                </Link>
              </div>

              <p className="text-xs text-muted-foreground">
                {plan.maxEmployees !== null ? `Up to ${plan.maxEmployees} employees` : "Unlimited employees"}
              </p>

              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <span className="size-1.5 rounded-full bg-primary/60 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between mt-auto">
                <code className="text-[11px] font-mono text-muted-foreground">{plan.code}</code>
                {isAdmin && <PlanFormDialog mode="edit" plan={plan} />}
              </div>
            </div>
          );
        })}
      </div>

      {isAdmin && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <h2 className="text-xs font-medium text-foreground uppercase tracking-wider mb-3">Admin notes</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Plan codes are immutable once created — tenants reference them.</li>
            <li>Set a plan on each tenant&apos;s detail page under Subscription.</li>
            <li>Leave price empty for custom-pricing tiers (Enterprise). Leave max employees empty for unlimited.</li>
            <li>Counts shown are ACTIVE + TRIAL tenants only.</li>
          </ul>
        </div>
      )}
    </>
  );
}
