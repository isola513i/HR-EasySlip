import { requirePlatformSession } from "@/lib/auth/platform";
import { getControlPlane } from "@/lib/db/control-plane";
import { PLATFORM_VIEWER_ROLES } from "@/lib/security/platform-rbac";
import { getPlans } from "@/lib/platform/plan-catalog";
import { PageHeader } from "@/components/platform/page-header";
import { DataTable } from "@/components/platform/data-table";
import { FilterBar } from "@/components/platform/filter-bar";
import { StatusBadge } from "@/components/platform/status-badge";
import { CopyButton } from "@/components/platform/copy-button";
import { TenantActionsMenu } from "./tenant-actions-menu";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Plus, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Tenants — EasySlip Platform" };

const PAGE_SIZE = 25;

const STATUS_TABS = [
  { label: "All",     value: "" },
  { label: "Active",  value: "ACTIVE" },
  { label: "Trial",   value: "TRIAL" },
  { label: "Expired", value: "TRIAL_EXPIRED" },
  { label: "Suspended", value: "SUSPENDED" },
];

interface Props {
  searchParams: Promise<{ q?: string; status?: string; plan?: string; page?: string }>;
}

export default async function TenantsPage({ searchParams }: Props) {
  const { q, status, plan, page: pageParam } = await searchParams;
  await requirePlatformSession(PLATFORM_VIEWER_ROLES);
  const cp = getControlPlane();
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const where = {
    status: status ? { equals: status } : { not: "DELETED" as const },
    ...(q ? {
      OR: [
        { slug: { contains: q, mode: "insensitive" as const } },
        { companyName: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(plan === "__none__" ? { planCode: null } : plan ? { planCode: plan } : {}),
  };

  const [tenants, total, plans] = await Promise.all([
    cp.tenant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        companyName: true,
        planCode: true,
        status: true,
        trialEndsAt: true,
        provisionedAt: true,
        createdAt: true,
      },
    }),
    cp.tenant.count({ where }),
    getPlans(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const planOptions = plans.map((p) => ({ value: p.code, label: p.name }));

  type TenantRow = (typeof tenants)[number];

  const columns = [
    {
      key: "company",
      label: "Company",
      cell: (t: TenantRow) => (
        <div>
          <Link href={`/platform/tenants/${t.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
            {t.companyName}
          </Link>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="font-mono text-xs text-muted-foreground">{t.slug}</span>
            <CopyButton value={t.slug} />
          </div>
        </div>
      ),
    },
    {
      key: "plan",
      label: "Plan",
      cell: (t: TenantRow) => (
        <span className={cn("text-sm", t.planCode ? "text-foreground" : "text-muted-foreground")}>
          {t.planCode ?? "No plan"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      cell: (t: TenantRow) => <StatusBadge status={t.status} />,
    },
    {
      key: "trialEnds",
      label: "Trial ends",
      cell: (t: TenantRow) => (
        <span className="text-xs text-muted-foreground">
          {t.trialEndsAt ? new Date(t.trialEndsAt).toLocaleDateString("en-GB") : "—"}
        </span>
      ),
    },
    {
      key: "provisioned",
      label: "Provisioned",
      cell: (t: TenantRow) =>
        t.provisionedAt
          ? <CheckCircle2 className="size-4 text-emerald-400" />
          : <XCircle className="size-4 text-muted-foreground/40" />,
    },
    {
      key: "actions",
      label: "",
      className: "w-10",
      cell: (t: TenantRow) => <TenantActionsMenu tenant={t} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Tenants"
        subtitle={`${total} workspace${total !== 1 ? "s" : ""}`}
        action={
          <Link href="/platform/tenants/new" className={buttonVariants({ size: "sm" })}>
            <Plus className="size-4 mr-1.5" />New tenant
          </Link>
        }
      />

      <div className="flex items-center gap-1 mb-4 border-b border-border pb-4">
        {STATUS_TABS.map((tab) => {
          const isActive = (tab.value === "" && !status) || tab.value === status;
          const href = tab.value ? `/platform/tenants?status=${tab.value}` : "/platform/tenants";
          return (
            <Link
              key={tab.value}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors duration-150",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20 font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <FilterBar
        searchPlaceholder="Search company or slug..."
        planOptions={planOptions}
        defaultValues={{ q, plan }}
      />

      <DataTable
        columns={columns}
        rows={tenants}
        getRowKey={(t) => t.id}
        emptyState={
          <p className="text-center text-muted-foreground text-sm py-4">No tenants match your filters.</p>
        }
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>Page {page} of {totalPages} ({total} total)</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/platform/tenants?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), ...(plan ? { plan } : {}), page: String(page - 1) })}`}
                className="px-3 py-1.5 rounded-md bg-card border border-border hover:bg-muted/60 transition-colors text-xs"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/platform/tenants?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), ...(plan ? { plan } : {}), page: String(page + 1) })}`}
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
