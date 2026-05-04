"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MobileTopbar } from "@/components/shared/mobile-topbar";
import { useLeaveForm } from "@/hooks/use-leave-form";
import { useAttendancePolicy } from "@/hooks/use-attendance-policy";
import { bangkokTodayKey } from "@/lib/datetime/bangkok";
import { useT } from "@/lib/i18n/locale-context";

export function LeaveScreen() {
  const t = useT();
  const { policy } = useAttendancePolicy();
  const morningRange = `${policy.halfday.morningStart}–${policy.halfday.morningEnd}`;
  const afternoonRange = `${policy.halfday.afternoonStart}–${policy.halfday.afternoonEnd}`;

  // Allow up to 1 year ahead. Backdating is restricted to 7 days for SICK
  // leave use-cases; the backend enforces the final policy.
  const todayKey = bangkokTodayKey();
  const minStart = (() => {
    const d = new Date(`${todayKey}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() - 7);
    return d.toISOString().slice(0, 10);
  })();
  const maxEnd = (() => {
    const d = new Date(`${todayKey}T00:00:00.000Z`);
    d.setUTCFullYear(d.getUTCFullYear() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const LEAVE_TYPES = [
    { key: "SICK" as const, label: t.leave.sick, sub: t.leave.sickDesc },
    { key: "PERSONAL" as const, label: t.leave.personal, sub: t.leave.personalDesc },
    { key: "ANNUAL" as const, label: t.leave.annual, sub: t.leave.annualDesc },
    { key: "LEAVE_WITHOUT_PAY" as const, label: t.leave.lwp, sub: t.leave.lwpDesc },
  ];

  const DURATIONS = [
    { key: "FULL" as const, label: t.leave.fullDay, sub: t.leave.fullDay },
    { key: "MORNING" as const, label: t.leave.morning, sub: morningRange },
    { key: "AFTERNOON" as const, label: t.leave.afternoon, sub: afternoonRange },
  ];

  const {
    leaveType, setLeaveType, halfDay, setHalfDay,
    startDate, setStartDate, endDate, setEndDate,
    reason, setReason, preview, isSubmitting,
    isLoadingQuotas, quotaError, submit, getBalance,
  } = useLeaveForm();

  const searchParams = useSearchParams();
  useEffect(() => {
    const qStart = searchParams.get("startDate");
    const qEnd = searchParams.get("endDate");
    const isoRx = /^\d{4}-\d{2}-\d{2}$/;
    if (qStart && isoRx.test(qStart)) setStartDate(qStart);
    if (qEnd && isoRx.test(qEnd)) setEndDate(qEnd);
    // intentionally only on initial render (when query params change via navigation, the page remounts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (quotaError) toast.error(t.leave.quotaLoadFailed);
  }, [quotaError, t.leave.quotaLoadFailed]);

  const handleSubmit = async () => {
    try {
      const result = await submit();
      if (result) toast.success(t.leave.submitSuccess);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.leave.submitFailed);
    }
  };

  return (
    <>
      <MobileTopbar title={t.leave.title} backHref="/employee/today" />

      <div className="flex flex-col gap-4 p-4">
        <Link
          href="/employee/leave/calendar"
          className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-[13px] shadow-[var(--es-shadow-sm)] transition-colors hover:bg-muted"
        >
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4 text-[var(--es-accent-600)]" />
            <span className="font-medium">{t.myLeaveCalendar.title}</span>
          </span>
          <span className="text-[11px] text-muted-foreground">{t.myLeaveCalendar.subtitle}</span>
        </Link>

        {/* Leave type picker */}
        <div>
          <label className="mb-2 block text-[13px] font-medium">{t.leave.type}</label>
          <div className="grid grid-cols-2 gap-2">
            {LEAVE_TYPES.map((lt) => {
              const sel = leaveType === lt.key;
              return (
                <button key={lt.key} onClick={() => setLeaveType(lt.key)} className={cn("rounded-[10px] p-3 text-left transition-colors", sel ? "border-[1.5px] border-[var(--es-accent-600)] bg-[var(--es-accent-50)]" : "border border-[var(--es-neutral-300)] bg-card")}>
                  <div className="text-sm font-semibold">{lt.label}</div>
                  <div className="text-[11px] text-muted-foreground">{lt.sub}</div>
                  <div className={cn("tabular-nums mt-1 text-[11px] font-semibold", sel ? "text-[var(--es-accent-700)]" : "text-muted-foreground")}>
                    {isLoadingQuotas ? t.common.loading : quotaError ? t.common.error : `${t.leave.balance}: ${getBalance(lt.key)}`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {/* Date range */}
        <div>
          <label className="mb-2 block text-[13px] font-medium">{t.leave.dateRange}</label>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.leave.from}</div>
              <input
                type="date"
                value={startDate}
                min={minStart}
                max={maxEnd}
                onChange={(e) => { setStartDate(e.target.value); if (!endDate || e.target.value > endDate) setEndDate(e.target.value); }}
                className="mt-0.5 w-full border-none bg-transparent text-[15px] font-semibold outline-none"
              />
            </div>
            <div className="rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.leave.to}</div>
              <input
                type="date"
                value={endDate}
                min={startDate || minStart}
                max={maxEnd}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-0.5 w-full border-none bg-transparent text-[15px] font-semibold outline-none"
              />
            </div>
          </div>
        </div>
        {/* Duration */}
        <div>
          <label className="mb-2 block text-[13px] font-medium">{t.leave.duration}</label>
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map((o) => {
              const sel = halfDay === o.key;
              return (
                <button key={o.key} onClick={() => setHalfDay(o.key)} className={cn("flex flex-col gap-0.5 rounded-lg px-2 py-2.5 text-[13px] font-semibold transition-colors", sel ? "border-[1.5px] border-[var(--es-accent-600)] bg-[var(--es-accent-600)] text-white" : "border border-[var(--es-neutral-300)] bg-card text-foreground")}>
                  <span>{o.label}</span>
                  <span className={cn("text-[10px] font-normal", sel ? "opacity-85" : "opacity-60")}>{o.sub}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Reason + Attachment */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">{t.leave.reason}</label>
          <Textarea placeholder={t.leave.reasonPlaceholder} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <button className="flex items-center gap-2.5 rounded-lg border border-dashed border-[var(--es-neutral-300)] bg-[var(--es-neutral-50)] px-3 py-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted">
          <Paperclip className="size-4" /> {t.leave.attachMedCert}
        </button>

        {/* Summary */}
        {preview && (
          <div className={cn(
            "flex items-center justify-between rounded-[10px] border p-3 text-[12px]",
            preview.sufficient
              ? "border-[var(--es-accent-200)] bg-[var(--es-accent-50)] text-[var(--es-accent-800)]"
              : "border-[var(--es-error-200)] bg-[var(--es-error-50)] text-[var(--es-error-700)]",
          )}>
            <div>
              <div className="font-semibold">{t.leave.daySummary}</div>
              <div className="tabular-nums text-[11px] opacity-80">
                {startDate} – {endDate} · {t.leave.excludeHolidays}
              </div>
            </div>
            <div className="tabular-nums text-[22px] font-bold">
              {preview.days}<span className="text-xs opacity-70"> {t.common.days}</span>
            </div>
          </div>
        )}

        {preview?.overlap && (
          <div className="rounded-[10px] border border-[var(--es-error-200)] bg-[var(--es-error-50)] p-3 text-[12px] text-[var(--es-error-700)]">
            {t.leave.overlapWarning
              .replace("{leaveType}", preview.overlap.leaveType)
              .replace("{startDate}", preview.overlap.startDate)
              .replace("{endDate}", preview.overlap.endDate)
              .replace("{status}", preview.overlap.status)}
          </div>
        )}

        {/* Submit */}
        <Button
          className="w-full"
          size="lg"
          disabled={
            isSubmitting
            || !startDate
            || !endDate
            || !reason.trim()
            || (preview !== null && (!preview.sufficient || !!preview.overlap))
          }
          onClick={handleSubmit}
        >
          {isSubmitting ? t.leave.submitting : t.leave.submit}
        </Button>
      </div>
    </>
  );
}
