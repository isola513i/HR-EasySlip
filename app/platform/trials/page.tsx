import { requirePlatformSession } from "@/lib/auth/platform";
import { getControlPlane } from "@/lib/db/control-plane";
import { PLATFORM_TRIAL_ROLES } from "@/lib/security/platform-rbac";
import { PageHeader } from "@/components/platform/page-header";
import { DataTable } from "@/components/platform/data-table";
import { FilterBar } from "@/components/platform/filter-bar";
import { StatusBadge } from "@/components/platform/status-badge";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Trials — EasySlip Platform" };

const TABS = [
  { label: "Pending",   value: "PENDING" },
  { label: "Approved",  value: "APPROVED" },
  { label: "Rejected",  value: "REJECTED" },
  { label: "Converted", value: "CONVERTED" },
];

interface Props {
  searchParams: Promise<{ q?: string; tab?: string }>;
}

export default async function TrialsPage({ searchParams }: Props) {
  const { q, tab = "PENDING" } = await searchParams;
  await requirePlatformSession(PLATFORM_TRIAL_ROLES);
  const cp = getControlPlane();

  const isConverted = tab === "CONVERTED";

  const where = {
    ...(isConverted
      ? { status: "APPROVED" as const, tenantId: { not: null } }
      : { status: tab as "PENDING" | "APPROVED" | "REJECTED" }),
    ...(q ? {
      OR: [
        { companyName: { contains: q, mode: "insensitive" as const } },
        { contactEmail: { contains: q, mode: "insensitive" as const } },
        { desiredSlug: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [signups, tabCounts] = await Promise.all([
    cp.trialSignup.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    Promise.all([
      cp.trialSignup.count({ where: { status: "PENDING" } }),
      cp.trialSignup.count({ where: { status: "APPROVED" } }),
      cp.trialSignup.count({ where: { status: "REJECTED" } }),
      cp.trialSignup.count({ where: { status: "APPROVED", tenantId: { not: null } } }),
    ]),
  ]);

  const counts = {
    PENDING: tabCounts[0],
    APPROVED: tabCounts[1],
    REJECTED: tabCounts[2],
    CONVERTED: tabCounts[3],
  };

  const now = Date.now();

  type SignupRow = (typeof signups)[number];

  const columns = [
    {
      key: "company",
      label: "Company",
      cell: (s: SignupRow) => {
        const agingDays = Math.floor((now - s.createdAt.getTime()) / 86400000);
        const isAging = s.status === "PENDING" && agingDays >= 7;
        return (
          <div className="flex items-center gap-2">
            {isAging && (
              <AlertCircle className="size-3.5 text-amber-400 shrink-0" aria-label={`Awaiting review for ${agingDays} days`} />
            )}
            <div>
              <p className="font-medium text-foreground">{s.companyName}</p>
              <p className="text-xs font-mono text-muted-foreground">{s.desiredSlug}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "contact",
      label: "Contact",
      cell: (s: SignupRow) => (
        <div>
          <p className="text-sm text-foreground">{s.contactName}</p>
          <p className="text-xs text-muted-foreground">{s.contactEmail}</p>
        </div>
      ),
    },
    {
      key: "size",
      label: "Size",
      cell: (s: SignupRow) => (
        <span className="text-sm text-muted-foreground">{s.teamSize ?? "—"}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      cell: (s: SignupRow) => <StatusBadge status={s.status} />,
    },
    {
      key: "submitted",
      label: "Submitted",
      cell: (s: SignupRow) => {
        const agingDays = Math.floor((now - s.createdAt.getTime()) / 86400000);
        const isAging = s.status === "PENDING" && agingDays >= 7;
        return (
          <span className={cn("text-xs", isAging ? "text-amber-400" : "text-muted-foreground")}>
            {new Date(s.createdAt).toLocaleDateString("en-GB")}
            {isAging && <span className="ml-1 font-medium">({agingDays}d)</span>}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "",
      className: "w-16",
      cell: (s: SignupRow) =>
        s.status === "PENDING" ? (
          <Link href={`/platform/trials/${s.id}`} className="text-xs text-primary hover:underline font-medium">
            Review
          </Link>
        ) : (
          <Link href={`/platform/trials/${s.id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View
          </Link>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Trial signups"
        subtitle={`${counts.PENDING} pending review`}
      />

      <div className="flex items-center gap-1 mb-4 border-b border-border pb-4">
        {TABS.map((t) => {
          const count = counts[t.value as keyof typeof counts];
          const isActive = tab === t.value;
          return (
            <Link
              key={t.value}
              href={`/platform/trials?tab=${t.value}`}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors duration-150",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20 font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              {t.label}
              {count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full tabular-nums",
                  isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <FilterBar
        searchPlaceholder="Search company, email or slug..."
        defaultValues={{ q }}
      />

      <DataTable
        columns={columns}
        rows={signups}
        getRowKey={(s) => s.id}
        emptyState={
          <p className="text-center text-muted-foreground text-sm py-4">No signups in this category.</p>
        }
        rowClassName={(s) => {
          const agingDays = Math.floor((now - s.createdAt.getTime()) / 86400000);
          return s.status === "PENDING" && agingDays >= 7 ? "bg-amber-500/5" : undefined;
        }}
      />
    </>
  );
}
