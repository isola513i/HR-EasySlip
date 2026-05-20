"use client";

import { Download, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuditLogs, type ActorTypeFilter } from "@/hooks/use-audit-logs";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import { useLocale } from "@/hooks/use-locale";
import { categorizeAction, moduleForEntity } from "@/lib/audit/categories";
import { getActionLabel } from "@/lib/audit/action-labels";
import { downloadCSV, rowsToCSV } from "@/lib/export/csv-download";
import { AuditKpis } from "@/components/hr/audit/audit-kpis";
import { AuditFilters } from "@/components/hr/audit/audit-filters";
import { AuditTable } from "@/components/hr/audit/audit-table";
import { AuditPagination } from "@/components/hr/audit/audit-pagination";
import { SecurityComplianceBanner } from "@/components/hr/audit/security-banner";

export function AuditLog() {
  const t = useT();
  const fmt = useFormat();
  const { locale } = useLocale();
  const {
    logs,
    summary,
    page,
    setPage,
    total,
    perPage,
    totalPages,
    search,
    setSearch,
    moduleFilter,
    setModuleFilter,
    actorTypeFilter,
    setActorTypeFilter,
    dateRange,
    setDateRange,
    isLoading,
    error,
  } = useAuditLogs();

  const handleExport = () => {
    if (logs.length === 0) {
      toast.error(t.hr.exportFailed);
      return;
    }
    const header = ["Timestamp", "User", "Action", "Category", "Module", "EntityType", "EntityId", "IPAddress"] as const;
    const data = logs.map((r) => [
      r.createdAt,
      r.actor?.email ?? r.actorId,
      getActionLabel(r.action, locale),
      categorizeAction(r.action),
      moduleForEntity(r.entityType),
      r.entityType,
      r.entityId,
      r.ipAddress ?? "",
    ]);
    downloadCSV(rowsToCSV(header, data), `audit-log-${fmt.formatShortDate(new Date().toISOString(), "numeric")}.csv`);
    toast.success(t.hr.exportSuccess);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">{t.hr.audit.pageTitle}</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{t.hr.audit.pageSubtitle}</p>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-1.5">
          <Download className="size-4" />
          {t.hr.audit.exportLog}
        </Button>
      </div>

      <AuditKpis summary={summary} range={dateRange} isLoading={isLoading} />

      <AuditFilters
        search={search}
        onSearchChange={setSearch}
        moduleFilter={moduleFilter}
        onModuleChange={setModuleFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* Platform Support filter chip */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActorTypeFilter(actorTypeFilter === "PLATFORM_SUPPORT" ? "ALL" : "PLATFORM_SUPPORT")}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            actorTypeFilter === "PLATFORM_SUPPORT"
              ? "border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-400"
              : "border-border text-muted-foreground hover:border-amber-500/30 hover:text-amber-700 dark:hover:text-amber-400"
          }`}
        >
          <Shield className="size-3" />
          Platform Support
        </button>
      </div>

      <AuditTable rows={logs} isLoading={isLoading} error={error} />

      <AuditPagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
        onPageChange={setPage}
      />

      <SecurityComplianceBanner totalEntries={summary.grandTotal} />
    </div>
  );
}
