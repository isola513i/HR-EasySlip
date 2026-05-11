"use client";

import { useMemo, useState } from "react";
import { CheckCheck, Coins, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/shared/status-pill";
import { ScrollableTable } from "@/components/shared/scrollable-table";
import { PayrollConfirmDialog } from "@/components/hr/payroll/payroll-confirm-dialog";
import { useCashout, type CashoutRecord, type CashoutStatus } from "@/hooks/use-cashout";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear - 1, currentYear, currentYear + 1];
const GRID = "grid-cols-[1.4fr_80px_120px_120px_140px_110px]";

const STATUS_TONE: Record<CashoutStatus, "warn" | "success"> = {
  PENDING: "warn",
  EXPORTED: "success",
};

const TRIGGER_KEY: Record<string, "yearEnd" | "resignation" | "termination"> = {
  YEAR_END: "yearEnd",
  RESIGNATION: "resignation",
  TERMINATION: "termination",
};

export function CashoutDashboard() {
  const t = useT();
  const fmt = useFormat();
  const { items, isLoading, error, year, setYear, markExported, downloadCsv } = useCashout();
  const [markTarget, setMarkTarget] = useState<CashoutRecord | null>(null);
  const [marking, setMarking] = useState(false);

  const stats = useMemo(() => {
    const pending = items.filter((c) => c.exportStatus === "PENDING").length;
    const exported = items.filter((c) => c.exportStatus === "EXPORTED").length;
    const totalDays = items.reduce((sum, c) => sum + Number(c.unusedDays), 0);
    return { pending, exported, totalDays };
  }, [items]);

  const handleConfirmMark = async () => {
    if (!markTarget) return;
    setMarking(true);
    try {
      await markExported(markTarget.id);
      toast.success(t.hr.cashout.markSuccess);
      setMarkTarget(null);
    } catch {
      toast.error(t.hr.cashout.markFailed);
    } finally {
      setMarking(false);
    }
  };

  const handleDownload = async () => {
    try { await downloadCsv(); toast.success(t.hr.downloadSuccess); }
    catch { toast.error(t.hr.downloadFailed); }
  };

  const triggerLabel = (trig: string) => t.hr.cashout.triggers[TRIGGER_KEY[trig] ?? "yearEnd"];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">{t.hr.cashout.pageTitle}</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{t.hr.cashout.pageSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(year)} onValueChange={(v) => v && setYear(Number(v))}>
            <SelectTrigger className="h-10 min-w-[110px]">
              <SelectValue>{(value) => String(value)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleDownload} className="gap-1.5">
            <Download className="size-4" /> {t.hr.cashout.downloadCsv}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard label={t.hr.cashout.kpiPending} value={String(stats.pending)} tone="warn" />
        <KpiCard label={t.hr.cashout.kpiExported} value={String(stats.exported)} tone="success" />
        <KpiCard label={t.hr.cashout.kpiTotalDays} value={stats.totalDays.toFixed(1)} tone="accent" className="col-span-2 sm:col-span-1" />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-(--es-shadow-sm)">
        <div className="border-b border-border px-5 py-4">
          <div className="text-base font-semibold">{t.hr.cashout.listTitle}</div>
          <div className="text-[12px] text-muted-foreground">{t.hr.cashout.listSubtitle}</div>
        </div>

        {isLoading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        )}

        {!isLoading && error && (
          <div className="px-4 py-12 text-center text-sm text-destructive">{error}</div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-muted-foreground">
            <Coins className="size-10 opacity-40" />
            <p className="text-sm">{t.hr.cashout.empty.replace("{year}", String(year))}</p>
          </div>
        )}

        {!isLoading && !error && items.length > 0 && (
          <>
            {/* Mobile cards */}
            <div className="space-y-2 p-3 md:hidden">
              {items.map((c) => (
                <CashoutCardMobile
                  key={c.id}
                  record={c}
                  triggerLabel={triggerLabel(c.trigger)}
                  onMark={() => setMarkTarget(c)}
                />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <ScrollableTable minWidth={760}>
                <div className={`grid ${GRID} border-b border-border bg-(--es-neutral-50) px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground`}>
                  <span>{t.hr.cashout.colEmployee}</span>
                  <span>{t.hr.cashout.colYear}</span>
                  <span className="text-right">{t.hr.cashout.colDays}</span>
                  <span>{t.hr.cashout.colTrigger}</span>
                  <span>{t.hr.cashout.colStatus}</span>
                  <span className="text-right">{t.hr.cashout.colActions}</span>
                </div>
                {items.map((c) => (
                  <div key={c.id} className={`grid ${GRID} items-center border-b border-(--es-neutral-100) px-5 py-3.5 text-[13px] last:border-b-0`}>
                    <div>
                      <div className="font-semibold">{c.employee.firstNameTh} {c.employee.lastNameTh}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{c.employee.employeeCode}</div>
                    </div>
                    <span className="tabular-nums text-muted-foreground">{c.year}</span>
                    <span className="tabular-nums font-semibold text-right">{Number(c.unusedDays).toFixed(1)}</span>
                    <StatusPill tone="neutral" dot={false}>{triggerLabel(c.trigger)}</StatusPill>
                    <StatusPill tone={STATUS_TONE[c.exportStatus]}>
                      {c.exportStatus === "PENDING" ? t.hr.cashout.statusPending : t.hr.cashout.statusExported}
                    </StatusPill>
                    <div className="flex justify-end">
                      {c.exportStatus === "PENDING" ? (
                        <Button size="sm" variant="outline" onClick={() => setMarkTarget(c)}>
                          <CheckCheck className="mr-1 size-3.5" /> {t.hr.cashout.markBtn}
                        </Button>
                      ) : (
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {c.exportedAt ? fmt.formatShortDate(c.exportedAt) : "—"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </ScrollableTable>
            </div>
          </>
        )}
      </div>

      <PayrollConfirmDialog
        open={!!markTarget}
        title={t.hr.cashout.markTitle}
        body={t.hr.cashout.markConfirm
          .replace("{name}", markTarget ? `${markTarget.employee.firstNameTh} ${markTarget.employee.lastNameTh}` : "")
          .replace("{days}", markTarget ? Number(markTarget.unusedDays).toFixed(1) : "")}
        confirmLabel={t.hr.cashout.markBtn}
        loadingLabel={t.hr.payrollMarkingExported}
        loading={marking}
        onClose={() => setMarkTarget(null)}
        onConfirm={handleConfirmMark}
      />
    </div>
  );
}

function KpiCard({ label, value, tone, className }: { label: string; value: string; tone: "warn" | "success" | "accent"; className?: string }) {
  const ring = tone === "warn"
    ? "ring-(--es-warn-500)/30 bg-(--es-warn-500)/5"
    : tone === "success"
    ? "ring-(--es-success-500)/30 bg-(--es-success-500)/5"
    : "ring-(--es-accent-600)/25 bg-(--es-accent-600)/5";
  return (
    <div className={`rounded-xl border border-border bg-card p-4 shadow-(--es-shadow-sm) ring-1 ${ring} ${className ?? ""}`}>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function CashoutCardMobile({ record: c, triggerLabel, onMark }: { record: CashoutRecord; triggerLabel: string; onMark: () => void }) {
  const t = useT();
  const fmt = useFormat();
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 shadow-(--es-shadow-sm)">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{c.employee.firstNameTh} {c.employee.lastNameTh}</div>
          <div className="font-mono text-[11px] text-muted-foreground">{c.employee.employeeCode}</div>
        </div>
        <StatusPill tone={STATUS_TONE[c.exportStatus]}>
          {c.exportStatus === "PENDING" ? t.hr.cashout.statusPending : t.hr.cashout.statusExported}
        </StatusPill>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">{t.hr.cashout.colDays}:</span>
        <span className="tabular-nums font-semibold text-foreground">{Number(c.unusedDays).toFixed(1)}</span>
        <span className="text-muted-foreground">·</span>
        <StatusPill tone="neutral" dot={false}>{triggerLabel}</StatusPill>
      </div>
      {c.exportStatus === "EXPORTED" && c.exportedAt && (
        <div className="mt-2 text-[11px] text-muted-foreground tabular-nums">
          {t.hr.cashout.exportedAt}: {fmt.formatShortDate(c.exportedAt)}
        </div>
      )}
      {c.exportStatus === "PENDING" && (
        <Button size="sm" variant="outline" onClick={onMark} className="mt-3 w-full">
          <CheckCheck className="mr-1 size-3.5" /> {t.hr.cashout.markBtn}
        </Button>
      )}
    </div>
  );
}
