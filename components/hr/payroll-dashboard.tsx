"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePayroll, type PayrollCycle } from "@/hooks/use-payroll";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import { PayrollKpis } from "@/components/hr/payroll/payroll-kpis";
import { CyclesTable } from "@/components/hr/payroll/cycles-table";
import { CycleSummaryCard } from "@/components/hr/payroll/cycle-summary-card";
import { CycleLifecycleStepper } from "@/components/hr/payroll/cycle-lifecycle-stepper";
import { PayrollConfirmDialog } from "@/components/hr/payroll/payroll-confirm-dialog";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear - 1, currentYear, currentYear + 1];

function pickDefaultCycle(cycles: PayrollCycle[]): string | null {
  if (cycles.length === 0) return null;
  const today = new Date();
  const current = cycles.find(
    (c) => new Date(c.cycleStart) <= today && today <= new Date(c.cycleEnd),
  );
  if (current) return current.id;
  const open = cycles.find((c) => c.status === "OPEN");
  return (open ?? cycles[0]).id;
}

export function PayrollDashboard() {
  const t = useT();
  const fmt = useFormat();
  const {
    cycles, isLoading, error, year, setYear,
    lockCycle, markExported,
    downloadTimestamps, downloadCashout, downloadPayrollInfo, downloadEmployeeData,
  } = usePayroll();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lockTarget, setLockTarget] = useState<PayrollCycle | null>(null);
  const [locking, setLocking] = useState(false);
  const [exportTarget, setExportTarget] = useState<PayrollCycle | null>(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    setSelectedId((prev) => {
      if (prev && cycles.some((c) => c.id === prev)) return prev;
      return pickDefaultCycle(cycles);
    });
  }, [cycles]);

  const monthName = (m: number) => fmt.formatMonthShort(`${year}-${String(m).padStart(2, "0")}`);
  const selected = useMemo(() => cycles.find((c) => c.id === selectedId) ?? null, [cycles, selectedId]);

  const runConfirm = async (
    setLoading: (v: boolean) => void,
    fn: () => Promise<unknown>,
    onSuccess: () => void,
    success: string,
    failure: string,
  ) => {
    setLoading(true);
    try { await fn(); toast.success(success); onSuccess(); }
    catch { toast.error(failure); }
    finally { setLoading(false); }
  };

  const handleLockConfirm = () => lockTarget && runConfirm(
    setLocking,
    () => lockCycle(lockTarget.id),
    () => setLockTarget(null),
    t.hr.payrollLockSuccess.replace("{month}", monthName(lockTarget.month)),
    t.hr.payrollLockFailed,
  );

  const handleMarkExportedConfirm = () => exportTarget && runConfirm(
    setMarking,
    () => markExported(exportTarget.id),
    () => setExportTarget(null),
    t.hr.payrollMarkExportedSuccess.replace("{month}", monthName(exportTarget.month)),
    t.hr.payrollMarkExportedFailed,
  );

  const runWithToast = async (fn: () => Promise<unknown>, success: string, failure: string) => {
    try { await fn(); toast.success(success); } catch { toast.error(failure); }
  };

  const handleDownloadTimestamps = (c: PayrollCycle) =>
    runWithToast(() => downloadTimestamps(c.id), t.hr.downloadSuccess, t.hr.downloadFailed);
  const handleDownloadPayrollInfo = (c: PayrollCycle) =>
    runWithToast(() => downloadPayrollInfo(c.id), t.hr.payrollDownloadSuccess, t.hr.downloadFailed);
  const handleDownloadCashout = () =>
    runWithToast(() => downloadCashout(year), t.hr.downloadSuccess, t.hr.downloadFailed);
  const handleDownloadEmployeeData = () =>
    runWithToast(() => downloadEmployeeData(), t.hr.exportSuccess, t.hr.exportFailed);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">{t.hr.payroll.pageTitle}</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{t.hr.payroll.pageSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadEmployeeData} className="gap-1.5">
            <Users className="size-4" />
            {t.hr.payrollEmployeeData}
          </Button>
          <Button variant="outline" onClick={handleDownloadCashout} className="gap-1.5">
            <Download className="size-4" />
            {t.hr.payrollCashout} ({year})
          </Button>
        </div>
      </div>

      <PayrollKpis cycles={cycles} year={year} isLoading={isLoading} />

      <CyclesTable
        cycles={cycles}
        year={year}
        yearOptions={YEAR_OPTIONS}
        onYearChange={setYear}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onLock={setLockTarget}
        onMarkExported={setExportTarget}
        onDownloadTimestamps={handleDownloadTimestamps}
        onDownloadPayrollInfo={handleDownloadPayrollInfo}
        isLoading={isLoading}
        error={error}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <CycleSummaryCard
          cycle={selected}
          year={year}
          onLock={setLockTarget}
          onExport={handleDownloadPayrollInfo}
          onMarkExported={setExportTarget}
        />
        <CycleLifecycleStepper cycle={selected} />
      </div>

      <PayrollConfirmDialog
        open={!!exportTarget}
        title={t.hr.payrollMarkExportedTitle}
        body={t.hr.payrollMarkExportedConfirm
          .replace("{month}", exportTarget ? monthName(exportTarget.month) : "")
          .replace("{year}", String(year))}
        confirmLabel={t.hr.payrollConfirmMarkExported}
        loadingLabel={t.hr.payrollMarkingExported}
        loading={marking}
        onClose={() => setExportTarget(null)}
        onConfirm={handleMarkExportedConfirm}
      />

      <PayrollConfirmDialog
        open={!!lockTarget}
        title={t.hr.payrollLockTitle}
        body={t.hr.payrollLockConfirm
          .replace("{month}", lockTarget ? monthName(lockTarget.month) : "")
          .replace("{year}", String(year))}
        confirmLabel={t.hr.payrollConfirmLock}
        loadingLabel={t.hr.payrollLocking}
        loading={locking}
        onClose={() => setLockTarget(null)}
        onConfirm={handleLockConfirm}
      />
    </div>
  );
}
