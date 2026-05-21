"use client";

import { Download, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PdpaKpis } from "@/components/hr/pdpa/pdpa-kpis";
import dynamic from "next/dynamic";

const PdpaOverviewChart = dynamic(
  () => import("@/components/hr/pdpa/pdpa-overview-chart").then((m) => ({ default: m.PdpaOverviewChart })),
  { ssr: false },
);
import { PdpaCategories } from "@/components/hr/pdpa/pdpa-categories";
import { PdpaRecordsTable } from "@/components/hr/pdpa/pdpa-records-table";
import { PdpaComplianceBanner } from "@/components/hr/pdpa/pdpa-compliance-banner";
import { usePdpaOverview } from "@/hooks/use-pdpa-overview";
import { downloadCSV, rowsToCSV } from "@/lib/export/csv-download";
import { openMailto } from "@/lib/email/open-mailto";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";

export function PdpaScreen() {
  const t = useT();
  const fmt = useFormat();
  const { data, isLoading, error } = usePdpaOverview();

  const handleExport = () => {
    if (!data) return;
    const header = [
      t.hr.pdpa.recordsEmployeeId,
      t.hr.pdpa.recordsEmployee,
      t.hr.pdpa.recordsEmail,
      t.hr.pdpa.recordsConsentType,
      t.hr.pdpa.recordsStatus,
      t.hr.pdpa.recordsDate,
    ];
    const rows = data.records.map((r) => [
      r.employeeCode,
      `${r.firstNameTh} ${r.lastNameTh}`.trim(),
      r.email ?? "",
      r.consentType,
      r.status,
      r.grantedAt ? fmt.formatShortDate(r.grantedAt, "numeric") : "",
    ]);
    downloadCSV(rowsToCSV(header, rows), `pdpa-consent-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleSendReminder = () => {
    if (!data) return;
    const pendingEmails = data.records
      .filter((r) => (r.status === "PENDING" || r.status === "WITHDRAWN") && r.email)
      .map((r) => r.email!);
    if (pendingEmails.length === 0) {
      toast.info(t.hr.pdpa.reminderEmpty);
      return;
    }
    if (openMailto(pendingEmails)) {
      toast.success(t.hr.pdpa.reminderSent);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">{t.hr.pdpa.pageTitle}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{t.hr.pdpa.pageSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={!data} className="gap-1.5">
            <Download className="size-4" />
            {t.hr.pdpa.exportReport}
          </Button>
          <Button onClick={handleSendReminder} disabled={!data} className="gap-1.5">
            <Mail className="size-4" />
            {t.hr.pdpa.sendReminder}
          </Button>
        </div>
      </header>

      {error && !isLoading ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <PdpaKpis
        totals={data?.totals ?? { totalEmployees: 0, consented: 0, pending: 0, withdrawn: 0, partial: 0, consentRate: 0, complianceGrade: "D" }}
        isLoading={isLoading || !data}
      />

      {isLoading || !data ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
          <Skeleton className="h-[420px] rounded-xl" />
          <Skeleton className="h-[420px] rounded-xl" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
            <PdpaOverviewChart totals={data.totals} />
            <PdpaCategories categories={data.categories} totalEmployees={data.totals.totalEmployees} />
          </div>

          <PdpaRecordsTable records={data.records} />

          <PdpaComplianceBanner policy={data.policy} />
        </>
      )}
    </div>
  );
}
