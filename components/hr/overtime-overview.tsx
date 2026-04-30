"use client";

import { useMemo, useState, useCallback } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RejectDialog } from "@/components/manager/reject-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useHrOvertime, type HrOvertimeRow } from "@/hooks/use-hr-overtime";
import { downloadCSV, rowsToCSV } from "@/lib/export/csv-download";
import { useT } from "@/lib/i18n/locale-context";
import { OvertimeKpis } from "@/components/hr/overtime/overtime-kpis";
import { PendingOvertimeList } from "@/components/hr/overtime/pending-overtime-list";
import { TopOtEmployees, type TopOTRow } from "@/components/hr/overtime/top-ot-employees";
import { MonthlyTrendsChart, type TrendPoint } from "@/components/hr/overtime/monthly-trends-chart";

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildTopOT(rows: HrOvertimeRow[]): TopOTRow[] {
  const map = new Map<string, TopOTRow>();
  for (const r of rows) {
    if (r.status !== "APPROVED" || !r.hoursApproved) continue;
    const key = r.employee.employeeCode;
    const hours = Number(r.hoursApproved);
    const existing = map.get(key);
    if (existing) existing.hours += hours;
    else
      map.set(key, {
        employeeCode: key,
        name: `${r.employee.firstNameTh} ${r.employee.lastNameTh}`,
        hours,
      });
  }
  return [...map.values()].sort((a, b) => b.hours - a.hours).slice(0, 5);
}

function buildTrends(rows: HrOvertimeRow[]): TrendPoint[] {
  const sums = new Map<string, number>();
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    sums.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  for (const r of rows) {
    if (r.status !== "APPROVED" || !r.hoursApproved) continue;
    const k = monthKey(r.date);
    if (sums.has(k)) sums.set(k, sums.get(k)! + Number(r.hoursApproved));
  }
  return [...sums.entries()].map(([monthKey, hours]) => ({ monthKey, hours }));
}

function buildKpis(rows: HrOvertimeRow[]) {
  const today = new Date();
  const thisMonthKey = monthKey(today.toISOString());
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthKey = monthKey(lastMonthDate.toISOString());

  let monthHours = 0;
  let pendingCount = 0;
  let approvedCount = 0;
  let approvedThisMonth = 0;
  let approvedLastMonth = 0;
  const monthEmployees = new Set<string>();

  for (const r of rows) {
    const k = monthKey(r.date);
    const hours = r.hoursApproved ? Number(r.hoursApproved) : 0;
    const isThis = k === thisMonthKey;
    const isLast = k === lastMonthKey;

    if (isThis && hours > 0) {
      monthHours += hours;
      monthEmployees.add(r.employee.employeeCode);
    }
    if (r.status === "PENDING") pendingCount += 1;
    if (r.status === "APPROVED") {
      approvedCount += 1;
      if (isThis) approvedThisMonth += 1;
      if (isLast) approvedLastMonth += 1;
    }
  }

  const approvedDeltaPct =
    approvedLastMonth === 0
      ? null
      : ((approvedThisMonth - approvedLastMonth) / approvedLastMonth) * 100;

  const avg = monthEmployees.size === 0 ? 0 : monthHours / monthEmployees.size;
  return { monthHours, pendingCount, approvedCount, approvedDeltaPct, avg };
}

function buildOvertimeCSV(rows: HrOvertimeRow[]): string {
  const header = ["EmployeeCode", "Name", "Date", "Type", "Hours", "Rate", "Status", "Reason"] as const;
  const data = rows.map((r) => [
    r.employee.employeeCode,
    `${r.employee.firstNameTh} ${r.employee.lastNameTh}`,
    r.date,
    r.overtimeType,
    r.hoursApproved ?? "",
    r.rateMultiplier,
    r.status,
    r.reason ?? "",
  ]);
  return rowsToCSV(header, data);
}

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
