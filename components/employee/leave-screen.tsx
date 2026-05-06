"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { MobileTopbar } from "@/components/shared/mobile-topbar";
import { SectionLabel } from "@/components/shared/section-label";
import { PillToggleGroup } from "@/components/shared/pill-toggle-group";
import { FileAttachField } from "@/components/shared/file-attach-field";
import { LeaveTypeGrid } from "@/components/employee/leave/leave-type-grid";
import { LeavePreviewSummary } from "@/components/employee/leave/leave-preview-summary";
import { useLeaveForm } from "@/hooks/use-leave-form";
import { useAttendancePolicy } from "@/hooks/use-attendance-policy";
import { bangkokTodayKey, shiftIsoDays, shiftIsoYears } from "@/lib/datetime/bangkok";
import { OfflineQueuedError } from "@/lib/api/client";
import { useT } from "@/lib/i18n/locale-context";

export function LeaveScreen() {
  const t = useT();
  const { policy } = useAttendancePolicy();
  const morningRange = `${policy.halfday.morningStart}–${policy.halfday.morningEnd}`;
  const afternoonRange = `${policy.halfday.afternoonStart}–${policy.halfday.afternoonEnd}`;

  // Backdating capped to 7 days for SICK; backend enforces the final policy.
  const todayKey = bangkokTodayKey();
  const minStart = shiftIsoDays(todayKey, -7);
  const maxEnd = shiftIsoYears(todayKey, 1);

  const LEAVE_TYPES = useMemo(
    () => [
      { key: "SICK" as const, label: t.leave.sick },
      { key: "PERSONAL" as const, label: t.leave.personal },
      { key: "ANNUAL" as const, label: t.leave.annual },
      { key: "LEAVE_WITHOUT_PAY" as const, label: t.leave.lwp },
    ],
    [t.leave.sick, t.leave.personal, t.leave.annual, t.leave.lwp],
  );

  const DURATION_OPTIONS = useMemo(
    () => [
      { key: "FULL" as const, label: t.leave.fullDay },
      { key: "MORNING" as const, label: t.leave.morning },
      { key: "AFTERNOON" as const, label: t.leave.afternoon },
    ],
    [t.leave.fullDay, t.leave.morning, t.leave.afternoon],
  );

  const {
    leaveType, setLeaveType, halfDay, setHalfDay,
    startDate, setStartDate, endDate, setEndDate,
    reason, setReason, preview, isSubmitting,
    isLoadingQuotas, quotaError, submit, getBalance, isTypeIneligible,
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
    // Toast once per quotaError flip — t.leave.quotaLoadFailed identity
    // changes on locale switch; excluding it prevents duplicate toasts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotaError]);

  const handleSubmit = async () => {
    try {
      const result = await submit();
      if (result) toast.success(t.leave.submitSuccess);
    } catch (err) {
      if (err instanceof OfflineQueuedError) {
        toast.info(t.clock.offlineQueued, { duration: 6000 });
        return;
      }
      toast.error(err instanceof Error ? err.message : t.leave.submitFailed);
    }
  };

  const balanceFor = (key: (typeof LEAVE_TYPES)[number]["key"]) => {
    if (isLoadingQuotas) return t.common.loading;
    if (quotaError) return t.common.error;
    if (isTypeIneligible(key)) return t.leave.ineligibleProbation;
    return `${t.leave.balance}: ${getBalance(key)}`;
  };

  const calendarLink = (
    <Link
      href="/employee/leave/calendar"
      className="text-sm font-semibold text-[var(--es-accent-600)] hover:text-[var(--es-accent-700)]"
    >
      {t.myLeaveCalendar.title}
    </Link>
  );

  return (
    <>
      <MobileTopbar title={t.leave.title} rightAction={calendarLink} />

      <div className="flex flex-col gap-5 p-4">
        <div>
          <SectionLabel>{t.leave.type}</SectionLabel>
          <LeaveTypeGrid
            options={LEAVE_TYPES}
            selected={leaveType}
            onSelect={setLeaveType}
            getBalanceText={balanceFor}
            isIneligible={isTypeIneligible}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <SectionLabel>{t.leave.from}</SectionLabel>
            <DatePicker
              value={startDate}
              min={minStart}
              max={maxEnd}
              onChange={(v) => {
                setStartDate(v);
                if (!endDate || v > endDate) setEndDate(v);
              }}
              className="h-11 w-full rounded-xl"
            />
          </div>
          <div>
            <SectionLabel>{t.leave.to}</SectionLabel>
            <DatePicker
              value={endDate}
              min={startDate || minStart}
              max={maxEnd}
              onChange={setEndDate}
              className="h-11 w-full rounded-xl"
            />
          </div>
        </div>

        <div>
          <SectionLabel>{t.leave.duration}</SectionLabel>
          <PillToggleGroup
            options={DURATION_OPTIONS}
            value={halfDay}
            onChange={setHalfDay}
            ariaLabel={t.leave.duration}
          />
          {(halfDay === "MORNING" || halfDay === "AFTERNOON") && (
            <div className="mt-2 text-sm text-muted-foreground">
              {halfDay === "MORNING" ? morningRange : afternoonRange}
            </div>
          )}
        </div>

        <div>
          <SectionLabel>{t.leave.reason}</SectionLabel>
          <Textarea
            placeholder={t.leave.reasonPlaceholder}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="bg-[var(--es-neutral-50)]"
          />
        </div>

        {/* upload backend not yet implemented — field is disabled placeholder */}
        <FileAttachField
          label={t.leave.attachMedCert}
          actionLabel={t.common.selectFile}
          disabled
        />

        <LeavePreviewSummary preview={preview} startDate={startDate} endDate={endDate} />

        <Button
          className="w-full rounded-full"
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
