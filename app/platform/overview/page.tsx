import { requirePlatformSession } from "@/lib/auth/platform";
import { getControlPlane } from "@/lib/db/control-plane";
import { PLATFORM_VIEWER_ROLES } from "@/lib/security/platform-rbac";
import { PageHeader } from "@/components/platform/page-header";
import { StatusBadge } from "@/components/platform/status-badge";
import { SeverityBadge } from "@/components/platform/severity-badge";
import { getSeverity } from "@/lib/security/audit-severity";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

export const metadata = { title: "Overview — EasySlip Platform" };

export default async function PlatformOverviewPage() {
  await requirePlatformSession(PLATFORM_VIEWER_ROLES);
  const cp = getControlPlane();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [
    totalActive,
    trialCount,
    pendingSignups,
    expiredCount,
    unassignedCount,
    failedProvisioning,
    recentSignups,
    recentActivity,
  ] = await Promise.all([
    cp.tenant.count({ where: { status: { in: ["ACTIVE", "TRIAL"] } } }),
    cp.tenant.count({ where: { status: "TRIAL" } }),
    cp.trialSignup.count({ where: { status: "PENDING" } }),
    cp.tenant.count({ where: { status: "TRIAL_EXPIRED" } }),
    cp.tenant.count({ where: { status: { in: ["ACTIVE", "TRIAL"] }, planCode: null } }),
    cp.tenant.count({ where: { status: "PENDING", databaseUrlEnc: null, createdAt: { lt: oneHourAgo } } }),
    cp.trialSignup.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    cp.platformAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        actor: { select: { email: true } },
        tenant: { select: { slug: true } },
      },
    }),
  ]);

  const attentionItems = [
    { label: "Pending trial signups", count: pendingSignups, href: "/platform/trials?status=PENDING" },
    { label: "Tenants without plan", count: unassignedCount, href: "/platform/tenants?plan=__none__" },
    { label: "Expired trials", count: expiredCount, href: "/platform/tenants?status=TRIAL_EXPIRED" },
    { label: "Pending provisioning", count: failedProvisioning, href: "/platform/tenants?status=PENDING" },
  ].filter((i) => i.count > 0);

  return (
    <>
      <PageHeader title="Platform overview" subtitle={`${totalActive} active workspace${totalActive !== 1 ? "s" : ""}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <MetricCard
          label="Active tenants"
          value={totalActive}
          href="/platform/tenants?status=ACTIVE"
        />
        <MetricCard
          label="On trial"
          value={trialCount}
          href="/platform/tenants?status=TRIAL"
        />
        <MetricCard
          label="Pending signups"
          value={pendingSignups}
          href="/platform/trials?status=PENDING"
          alert={pendingSignups > 0}
        />
        <MetricCard
          label="Trial expired"
          value={expiredCount}
          href="/platform/tenants?status=TRIAL_EXPIRED"
          alert={expiredCount > 0}
        />
      </div>

      {attentionItems.length > 0 && (
        <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="size-4 text-amber-400 shrink-0" />
            <h2 className="text-sm font-medium text-amber-300">Needs attention</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {attentionItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-card border border-border hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors duration-150 group"
              >
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
                <span className="text-sm font-semibold text-amber-300 tabular-nums">{item.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-foreground">Recent trial signups</h2>
            <Link href="/platform/trials" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          {recentSignups.length === 0 ? (
            <div className="rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
              No trial signups yet.
            </div>
          ) : (
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {recentSignups.map((s) => {
                const agingDays = Math.floor((Date.now() - s.createdAt.getTime()) / 86400000);
                const isAging = s.status === "PENDING" && agingDays >= 7;
                return (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.companyName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{s.desiredSlug}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      {isAging && (
                        <span className="text-xs text-amber-400">{agingDays}d</span>
                      )}
                      <StatusBadge status={s.status} />
                      {s.status === "PENDING" && (
                        <Link href={`/platform/trials/${s.id}`} className="text-xs text-primary hover:underline">
                          Review
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-foreground">Recent activity</h2>
            <Link href="/platform/audit" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              View audit <ArrowRight className="size-3" />
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <div className="rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
              No activity recorded.
            </div>
          ) : (
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {recentActivity.map((log) => {
                const severity = getSeverity(log.action);
                return (
                  <div
                    key={log.id}
                    className={[
                      "flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors",
                      severity === "critical" ? "bg-rose-500/5" : severity === "warn" ? "bg-amber-500/5" : "bg-card",
                    ].join(" ")}
                  >
                    <SeverityBadge severity={severity} className="mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs text-primary">{log.action}</span>
                      {log.tenant && (
                        <span className="text-xs text-muted-foreground"> · {log.tenant.slug}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function MetricCard({
  label,
  value,
  href,
  alert,
}: {
  label: string;
  value: number;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "group flex flex-col gap-2 rounded-xl border p-5 transition-all duration-150",
        alert
          ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
          : "bg-card border-border hover:border-primary/30 hover:bg-card",
      ].join(" ")}
    >
      <span className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 uppercase tracking-wider">
        {label}
      </span>
      <span className={["text-3xl font-semibold tabular-nums tracking-tight", alert ? "text-amber-300" : "text-foreground"].join(" ")}>
        {value}
      </span>
    </Link>
  );
}
