import { requirePlatformSession } from "@/lib/auth/platform";
import { getControlPlane } from "@/lib/db/control-plane";
import { PLATFORM_VIEWER_ROLES, PLATFORM_ADMIN_ROLES } from "@/lib/security/platform-rbac";
import { getSeverity } from "@/lib/security/audit-severity";
import { StatusBadge } from "@/components/platform/status-badge";
import { SeverityBadge } from "@/components/platform/severity-badge";
import { DetailRow } from "@/components/platform/detail-row";
import { CopyButton } from "@/components/platform/copy-button";
import { DangerZone } from "./danger-zone";
import { ChangePlanForm } from "./change-plan-form";
import { getPlans } from "@/lib/platform/plan-catalog";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Database, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "activity", label: "Activity" },
  { key: "danger", label: "Danger zone" },
];

export default async function TenantDetailPage({ params, searchParams }: Props) {
  const [{ id }, { tab = "overview" }] = await Promise.all([params, searchParams]);
  const session = await requirePlatformSession(PLATFORM_VIEWER_ROLES);
  const cp = getControlPlane();

  const [tenant, recentLogs, plans] = await Promise.all([
    cp.tenant.findUnique({
      where: { id },
      select: {
        id: true, slug: true, companyName: true, planCode: true, status: true,
        trialEndsAt: true, provisionedAt: true, createdAt: true, updatedAt: true, databaseUrlEnc: true,
      },
    }),
    cp.platformAuditLog.findMany({
      where: { tenantId: id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { actor: { select: { email: true } } },
    }),
    getPlans(),
  ]);

  if (!tenant) notFound();

  const isAdmin = PLATFORM_ADMIN_ROLES.includes(session.role);
  const domainSlug = `${tenant.slug}.easyslip.app`;

  const metadata = { title: `${tenant.companyName} — EasySlip Platform` };
  void metadata;

  return (
    <>
      <div className="mb-6">
        <Link
          href="/tenants"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-3" /> Tenants
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">{tenant.companyName}</h1>
                <StatusBadge status={tenant.status} />
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-mono text-xs text-muted-foreground">{domainSlug}</span>
                <CopyButton value={domainSlug} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isAdmin && (
              <Link
                href={`/tenants/${tenant.id}/impersonate`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
              >
                Impersonate
              </Link>
            )}
            <span className="text-xs text-muted-foreground">
              Created {new Date(tenant.createdAt).toLocaleDateString("en-GB")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-0.5 mb-6 border-b border-border pb-4">
        {TABS.map(({ key, label }) => {
          const isActive = tab === key;
          const isDanger = key === "danger";
          return (
            <Link
              key={key}
              href={`/tenants/${id}?tab=${key}`}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors duration-150",
                isActive
                  ? isDanger
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium"
                    : "bg-primary/10 text-primary border border-primary/20 font-medium"
                  : isDanger
                  ? "text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <h2 className="text-sm font-medium text-foreground mb-4">Tenant details</h2>
            <DetailRow label="ID" value={tenant.id} mono />
            <DetailRow label="Slug" value={tenant.slug} mono />
            <DetailRow
              label="Trial ends"
              value={tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toLocaleDateString("en-GB") : "—"}
            />
            <DetailRow
              label="Provisioned"
              value={tenant.provisionedAt ? new Date(tenant.provisionedAt).toLocaleString("en-GB") : "—"}
            />
            <DetailRow label="Created" value={new Date(tenant.createdAt).toLocaleString("en-GB")} />
            <DetailRow label="Updated" value={new Date(tenant.updatedAt).toLocaleString("en-GB")} />
          </div>

          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-sm font-medium text-foreground mb-4">Subscription</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Plan</p>
                  <p className={cn("text-sm font-medium", tenant.planCode ? "text-foreground" : "text-muted-foreground")}>
                    {tenant.planCode ?? "No plan assigned"}
                  </p>
                </div>
                {isAdmin && (
                  <ChangePlanForm
                    tenantId={tenant.id}
                    currentPlan={tenant.planCode}
                    plans={plans.map((p) => ({ code: p.code, name: p.name }))}
                  />
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-sm font-medium text-foreground mb-4">Provisioning</h2>
              <div className="flex items-center gap-2.5 mb-4">
                {tenant.databaseUrlEnc ? (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                    <span className="text-sm text-foreground">Database configured</span>
                  </>
                ) : (
                  <>
                    <Database className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground">Database not configured</span>
                  </>
                )}
              </div>
              {isAdmin && !tenant.databaseUrlEnc && (
                <Link
                  href={`/tenants/${tenant.id}/provision`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  Provision database
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "activity" && (
        <div className="rounded-xl border border-border overflow-hidden">
          {recentLogs.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">No activity recorded for this tenant.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentLogs.map((log) => {
                const severity = getSeverity(log.action);
                return (
                  <div
                    key={log.id}
                    className={cn(
                      "flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors",
                      severity === "critical" ? "bg-rose-500/5" : severity === "warn" ? "bg-amber-500/5" : "bg-background"
                    )}
                  >
                    <SeverityBadge severity={severity} className="mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-xs text-primary">{log.action}</span>
                      <span className="text-xs text-muted-foreground"> · {log.actor.email}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {new Date(log.createdAt).toLocaleString("en-GB")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "danger" && isAdmin && (
        <DangerZone
          tenantId={tenant.id}
          companyName={tenant.companyName}
          status={tenant.status}
        />
      )}

      {tab === "danger" && !isAdmin && (
        <p className="text-muted-foreground text-sm">Insufficient permissions.</p>
      )}
    </>
  );
}
