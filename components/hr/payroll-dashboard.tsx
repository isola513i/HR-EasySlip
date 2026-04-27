"use client";

import { useState } from "react";
import { Download, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { StatusPill } from "@/components/shared/status-pill";
import { usePayroll, type PayrollCycle } from "@/hooks/use-payroll";
import { useT } from "@/lib/i18n/locale-context";

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];
const STATUS_TONE = { OPEN: "info", LOCKED: "warn", EXPORTED: "success" } as const;
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatPeriod(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function PayrollDashboard() {
  const t = useT();
  const { cycles, isLoading, error, year, setYear, lockCycle, downloadTimestamps, downloadCashout, downloadPayrollInfo, downloadEmployeeData } = usePayroll();
  const [lockTarget, setLockTarget] = useState<PayrollCycle | null>(null);
  const [locking, setLocking] = useState(false);

  const handleLock = async () => {
    if (!lockTarget) return;
    setLocking(true);
    try {
      await lockCycle(lockTarget.id);
      toast.success(t.hr.payrollLockSuccess.replace("{month}", MONTH_NAMES[lockTarget.month - 1]));
      setLockTarget(null);
    } catch { toast.error(t.hr.payrollLockFailed); }
    finally { setLocking(false); }
  };

  const handleDownloadTimestamps = async (id: string) => {
    try { await downloadTimestamps(id); toast.success(t.hr.downloadSuccess); }
    catch { toast.error(t.hr.downloadFailed); }
  };

  const handleDownloadCashout = async () => {
    try { await downloadCashout(year); toast.success(t.hr.downloadSuccess); }
    catch { toast.error(t.hr.downloadFailed); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {YEARS.map((y) => (
            <Button key={y} variant={year === y ? "default" : "outline"} size="sm" onClick={() => setYear(y)}>{y}</Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => downloadEmployeeData().then(() => toast.success(t.hr.exportSuccess)).catch(() => toast.error(t.hr.exportFailed))}>
            <Download className="mr-1.5 size-4" /> {t.hr.payrollEmployeeData}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownloadCashout}>
            <Download className="mr-1.5 size-4" /> {t.hr.payrollCashout} ({year})
          </Button>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : error ? (
        <div className="py-16 text-center text-[var(--es-error-500)]">{error}</div>
      ) : cycles.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">{t.hr.noPayrollCycles.replace("{year}", String(year))}</div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">{t.hr.payrollMonth}</TableHead>
                <TableHead>{t.hr.payrollPeriod}</TableHead>
                <TableHead className="w-[120px]">{t.profile.status}</TableHead>
                <TableHead className="w-[160px]">{t.hr.payrollLockedAt}</TableHead>
                <TableHead className="w-[200px]">{t.hr.payrollActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{MONTH_NAMES[c.month - 1]}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{formatPeriod(c.cycleStart, c.cycleEnd)}</TableCell>
                  <TableCell><StatusPill tone={STATUS_TONE[c.status]}>{c.status}</StatusPill></TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {c.lockedAt ? new Date(c.lockedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      {c.status === "OPEN" && (
                        <Button size="sm" variant="outline" onClick={() => setLockTarget(c)}><Lock className="mr-1 size-3.5" /> {t.hr.payrollLock}</Button>
                      )}
                      {(c.status === "LOCKED" || c.status === "EXPORTED") && (<>
                        <Button size="sm" variant="outline" onClick={() => handleDownloadTimestamps(c.id)}><Download className="mr-1 size-3.5" /> {t.hr.payrollTimestamps}</Button>
                        <Button size="sm" variant="outline" onClick={() => downloadPayrollInfo(c.id).then(() => toast.success(t.hr.payrollDownloadSuccess)).catch(() => toast.error(t.hr.downloadFailed))}><Download className="mr-1 size-3.5" /> {t.hr.payrollExport}</Button>
                      </>)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={!!lockTarget} onOpenChange={(o) => { if (!o) setLockTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t.hr.payrollLockTitle}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t.hr.payrollLockConfirm.replace("{month}", lockTarget ? MONTH_NAMES[lockTarget.month - 1] : "").replace("{year}", String(year))}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockTarget(null)}>{t.common.cancel}</Button>
            <Button disabled={locking} onClick={handleLock}>{locking ? t.hr.payrollLocking : t.hr.payrollConfirmLock}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
