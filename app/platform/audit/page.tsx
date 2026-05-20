import { requirePlatformSession } from "@/lib/auth/platform";
import { getControlPlane } from "@/lib/db/control-plane";
import { PLATFORM_VIEWER_ROLES } from "@/lib/security/platform-rbac";
import { getSeverity } from "@/lib/security/audit-severity";
import { PageHeader } from "@/components/platform/page-header";
import { SeverityBadge } from "@/components/platform/severity-badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = { title: "Audit — EasySlip Platform" };

const PAGE_SIZE = 50;

interface Props {
  searchParams: Promise<{ page?: string; action?: string; tenantSlug?: string }>;
}

export default async function AuditPage({ searchParams }: Props) {
  const { page: pageParam, action: actionFilter, tenantSlug } = await searchParams;
  await requirePlatformSession(PLATFORM_VIEWER_ROLES);
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const cp = getControlPlane();

  const tenantWhere = tenantSlug
    ? { tenant: { slug: { contains: tenantSlug, mode: "insensitive" as const } } }
    : {};
  const actionWhere = actionFilter
    ? { action: { contains: actionFilter, mode: "insensitive" as const } }
    : {};

  const where = { ...tenantWhere, ...actionWhere };

  const [logs, total] = await Promise.all([
    cp.platformAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        actor: { select: { email: true } },
        tenant: { select: { slug: true } },
      },
    }),
    cp.platformAuditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildPageHref = (p: number) => {
    const params = new URLSearchParams();
    if (actionFilter) params.set("action", actionFilter);
    if (tenantSlug) params.set("tenantSlug", tenantSlug);
    params.set("page", String(p));
    return `/audit?${params.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Audit log"
        subtitle={`${total.toLocaleString()} entries`}
      />

      <div className="rounded-xl border border-border overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-card border-b border-border">
                {["Time", "Severity", "Actor", "Action", "Tenant", "Target"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                    No audit log entries.
                  </td>
                </tr>
              )}
              {logs.map((log) => {
                const severity = getSeverity(log.action);
                return (
                  <tr
                    key={log.id}
                    className={cn(
                      "hover:bg-muted/30 transition-colors duration-100",
                      severity === "critical" ? "bg-rose-500/5" : severity === "warn" ? "bg-amber-500/5" : "bg-background"
                    )}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-muted-foreground" title={new Date(log.createdAt).toLocaleString("en-GB")}>
                        {new Date(log.createdAt).toLocaleString("en-GB")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={severity} />
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground/80">
                      {log.actor?.email ?? "system"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-primary">{log.action}</span>
                    </td>
                    <td className="px-4 py-3">
                      {log.tenant ? (
                        <Link
                          href={`/tenants?q=${log.tenant.slug}`}
                          className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          {log.tenant.slug}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground/60 font-mono">
                      {log.targetType && log.targetId
                        ? `${log.targetType}:${log.targetId.slice(0, 8)}`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildPageHref(page - 1)}
                className="px-3 py-1.5 rounded-md bg-card border border-border hover:bg-muted/60 transition-colors text-xs"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildPageHref(page + 1)}
                className="px-3 py-1.5 rounded-md bg-card border border-border hover:bg-muted/60 transition-colors text-xs"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
