import { requirePlatformSession } from "@/lib/auth/platform";
import { getControlPlane } from "@/lib/db/control-plane";
import { PLATFORM_ADMIN_ROLES } from "@/lib/security/platform-rbac";
import { PageHeader } from "@/components/platform/page-header";
import { StatusBadge } from "@/components/platform/status-badge";
import { InviteDialog } from "./invite-dialog";
import { MemberActions } from "./member-actions";
import { cn } from "@/lib/utils";

export const metadata = { title: "Team — EasySlip Platform" };

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  SUPPORT: "Support",
  BILLING: "Billing",
};

const ROLE_DESCS: Record<string, string> = {
  SUPER_ADMIN: "Full access",
  SUPPORT: "Trials + impersonation",
  BILLING: "Read-only",
};

const ROLE_STYLES: Record<string, string> = {
  SUPER_ADMIN: "bg-primary/15 text-primary border-primary/20",
  SUPPORT: "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
  BILLING: "bg-slate-500/15 text-slate-300 border-slate-500/20",
};

export default async function PlatformTeamPage() {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  const cp = getControlPlane();

  const users = await cp.platformUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, role: true, isDisabled: true, lastLoginAt: true, createdAt: true },
  });

  const isAdmin = PLATFORM_ADMIN_ROLES.includes(session.role);

  return (
    <>
      <PageHeader
        title="Platform team"
        subtitle="Manage staff access to this admin console."
        action={isAdmin ? <InviteDialog /> : undefined}
      />

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-card border-b border-border">
              {["Email", "Role", "Status", "Last login", "Created"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {h}
                </th>
              ))}
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="h-32 text-center text-muted-foreground text-sm">
                  No platform users found.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr
                key={u.id}
                className={cn(
                  "hover:bg-muted/30 transition-colors duration-100",
                  u.isDisabled ? "opacity-60" : ""
                )}
              >
                <td className="px-5 py-3.5 font-mono text-xs text-foreground">
                  {u.email}
                  {u.id === session.userId && (
                    <span className="ml-2 text-muted-foreground">(you)</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
                      ROLE_STYLES[u.role] ?? "bg-muted text-muted-foreground border-border"
                    )}
                    title={ROLE_DESCS[u.role]}
                  >
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={u.isDisabled ? "SUSPENDED" : "ACTIVE"} />
                </td>
                <td className="px-5 py-3.5 text-xs text-muted-foreground">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("en-GB") : "Never"}
                </td>
                <td className="px-5 py-3.5 text-xs text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString("en-GB")}
                </td>
                <td className="px-3 py-3.5 text-right">
                  {isAdmin && u.id !== session.userId && (
                    <MemberActions
                      userId={u.id}
                      currentRole={u.role}
                      isDisabled={u.isDisabled}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted-foreground/60">
        SUPER_ADMIN = full access · SUPPORT = trials + impersonation · BILLING = read-only
      </p>
    </>
  );
}
