"use client";

import { useMemo, useState, useCallback } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RejectDialog } from "@/components/manager/reject-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useHrOvertime, type HrOvertimeRow } from "@/hooks/use-hr-overtime";
import { downloadCSV } from "@/lib/export/csv-download";
import { useT } from "@/lib/i18n/locale-context";
import { buildTopOT, buildTrends, buildKpis, buildOvertimeCSV } from "@/lib/overtime/overtime-utils";
import { OvertimeKpis } from "@/components/hr/overtime/overtime-kpis";
import { PendingOvertimeList } from "@/components/hr/overtime/pending-overtime-list";
import { TopOtEmployees } from "@/components/hr/overtime/top-ot-employees";
import dynamic from "next/dynamic";

const MonthlyTrendsChart = dynamic(
  () => import("@/components/hr/overtime/monthly-trends-chart").then((m) => ({ default: m.MonthlyTrendsChart })),
  { ssr: false },
);

export function OvertimeOverview() {
  const t = useT();
  const { rows, isLoading, error, approve, reject } = useHrOvertime();
  const [rejectTarget, setRejectTarget] = useState<HrOvertimeRow | null>(null);
  const [approveTarget, setApproveTarget] = useState<HrOvertimeRow | null>(null);

  const handleApprove = useCallback(async () => {
    if (!approveTarget) return;
    try {
      await approve(approveTarget.id);
      toast.success(t.hr.overtime.overrideApproved);
    } catch {
      toast.error(t.manager.approveFailed);
    }
  }, [approveTarget, approve, t.hr.overtime.overrideApproved, t.manager.approveFailed]);

  const handleReject = useCallback(async (reason: string) => {
    if (!rejectTarget) return;
    try {
      await reject(rejectTarget.id, reason);
      toast.success(t.hr.overtime.overrideRejected);
    } catch {
      toast.error(t.manager.rejectFailed);
    }
  }, [rejectTarget, reject, t.hr.overtime.overrideRejected, t.manager.rejectFailed]);

  const pending = useMemo(() => rows.filter((r) => r.status === "PENDING").slice(0, 5), [rows]);
  const top = useMemo(() => buildTopOT(rows), [rows]);
  const trends = useMemo(() => buildTrends(rows), [rows]);
  const kpis = useMemo(() => buildKpis(rows), [rows]);

  const handleExport = () => {
    if (rows.length === 0) {
      toast.error(t.hr.exportFailed);
      return;
    }
    downloadCSV(buildOvertimeCSV(rows), `overtime-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(t.hr.exportSuccess);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">{t.hr.overtime.pageTitle}</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{t.hr.overtime.pageSubtitle}</p>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-1.5">
          <Download className="size-4" />
          {t.hr.overtime.exportReport}
        </Button>
      </div>

      <OvertimeKpis
        totalHours={kpis.monthHours}
        pendingCount={kpis.pendingCount}
        approvedCount={kpis.approvedCount}
        approvedDeltaPct={kpis.approvedDeltaPct}
        avgPerEmployee={kpis.avg}
        isLoading={isLoading}
      />

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <PendingOvertimeList
          rows={pending}
          isLoading={isLoading}
          onApprove={setApproveTarget}
          onReject={setRejectTarget}
        />
        <TopOtEmployees rows={top} isLoading={isLoading} />
      </div>

      <MonthlyTrendsChart data={trends} isLoading={isLoading} />

      <RejectDialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        employeeName={rejectTarget ? `${rejectTarget.employee.firstNameTh} ${rejectTarget.employee.lastNameTh}` : undefined}
      />
      <ConfirmDialog
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        title={t.hr.overtime.confirmHrApprove}
        confirmLabel={t.manager.approve}
      />
    </div>
  );
}
