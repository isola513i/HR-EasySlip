"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MobileTopbar } from "@/components/shared/mobile-topbar";
import { SectionLabel } from "@/components/shared/section-label";
import { PillToggleGroup } from "@/components/shared/pill-toggle-group";
import { LeavePreviewSummary } from "@/components/employee/leave/leave-preview-summary";
import { EntityAttachmentPanel } from "@/components/shared/entity-attachment-panel";
import { CalendarGrid } from "@/components/employee/leave-calendar/calendar-grid";
import { DayDetail } from "@/components/employee/leave-calendar/day-detail";
import { useLeaveForm } from "@/hooks/use-leave-form";
import { useMyLeaveCalendar } from "@/hooks/use-my-leave-calendar";
import { useAttendancePolicy } from "@/hooks/use-attendance-policy";
import { bangkokTodayKey, bangkokMonth, bangkokYear, bangkokDay, shiftIsoDays, shiftIsoYears } from "@/lib/datetime/bangkok";
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
      { key: "MATERNITY" as const, label: t.leave.maternity },
      { key: "PATERNITY" as const, label: t.leave.paternity },
      { key: "CHILD_CARE" as const, label: t.leave.childCare },
      { key: "ORDINATION" as const, label: t.leave.ordination },
      { key: "MILITARY" as const, label: t.leave.military },
      { key: "FUNERAL" as const, label: t.leave.funeral },
      { key: "TRAINING" as const, label: t.leave.training },
    ],
    [
      t.leave.sick, t.leave.personal, t.leave.annual, t.leave.lwp,
      t.leave.maternity, t.leave.paternity, t.leave.childCare, t.leave.ordination,
      t.leave.military, t.leave.funeral, t.leave.training,
    ],
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

  const { month, year, setMonth, setYear, requests, holidays, isLoading: calLoading, refetch: calRefetch } = useMyLeaveCalendar();
  const [selectedDay, setSelectedDay] = useState<number | null>(
    bangkokMonth() === month && bangkokYear() === year ? bangkokDay() : null,
  );
  const pad = (n: number) => n.toString().padStart(2, "0");
  const selectedIso = selectedDay !== null ? `${year}-${pad(month)}-${pad(selectedDay)}` : null;
  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1); setSelectedDay(null); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1); setSelectedDay(null); };

  // Holds the last successfully created leave id so we can show the
  // attachment panel without forcing a navigation away from this screen.
  const [submittedLeaveId, setSubmittedLeaveId] = useState<string | null>(null);

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
      if (result) {
        toast.success(t.leave.submitSuccess);
        setSubmittedLeaveId(result.request.id);
      }
    } catch (err) {
      if (err instanceof OfflineQueuedError) {
        toast.info(t.clock.offlineQueued, { duration: 6000 });
        return;
      }
      toast.error(err instanceof Error ? err.message : t.leave.submitFailed);
    }
  };

  const resetForm = () => {
    setSubmittedLeaveId(null);
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  const balanceFor = (key: (typeof LEAVE_TYPES)[number]["key"]) => {
    if (isLoadingQuotas) return t.common.loading;
    if (quotaError) return t.common.error;
    if (isTypeIneligible(key)) return t.leave.ineligibleProbation;
    return `${t.leave.balance}: ${getBalance(key)}`;
  };

  const calLegend = [
    { color: "bg-emerald-100", label: t.myLeaveCalendar.legendApproved },
    { color: "bg-amber-100", label: t.myLeaveCalendar.legendPending },
    { color: "bg-rose-100", label: t.myLeaveCalendar.legendRejected },
    { color: "bg-sky-50", label: t.myLeaveCalendar.legendHoliday },
  ];

  return (
    <>
      <MobileTopbar title={t.leave.title} />

      <div className="flex flex-col gap-5 p-4">
        <div>
          <SectionLabel>{t.leave.type}</SectionLabel>
          <Select value={leaveType} onValueChange={(v) => setLeaveType(v as typeof leaveType)}>
            <SelectTrigger className="h-11 w-full rounded-xl">
              <SelectValue>
                {leaveType
                  ? (LEAVE_TYPES.find((lt) => lt.key === leaveType)?.label ?? leaveType)
                  : t.leave.type}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {LEAVE_TYPES.map(({ key, label }) => (
                <SelectItem key={key} value={key} disabled={isTypeIneligible(key)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {leaveType && (
            <p className="mt-1.5 text-[12px] text-muted-foreground">{balanceFor(leaveType)}</p>
          )}
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
            className="bg-(--es-neutral-50)"
          />
        </div>

        {submittedLeaveId ? (
          <>
            <EntityAttachmentPanel
              entityType="LeaveRequest"
              entityId={submittedLeaveId}
              category="leave_attachment"
              title={t.leave.attachmentPanelTitle}
              description={t.leave.attachmentPanelDesc}
              doneLabel={t.leave.attachmentDone}
              onDone={resetForm}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              onClick={resetForm}
            >
              {t.leave.submitAnother}
            </Button>
          </>
        ) : (
          <>
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
          </>
        )}

        <div className="mt-2 flex flex-col gap-3">
          <div className="text-sm font-semibold">{t.myLeaveCalendar.title}</div>
          <CalendarGrid
            month={month} year={year}
            isLoading={calLoading}
            requests={requests} holidays={holidays}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onPrev={prevMonth} onNext={nextMonth}
          />
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
            {calLegend.map((it) => (
              <span key={it.label} className="inline-flex items-center gap-1.5">
                <span aria-hidden className={`inline-block size-3 rounded ${it.color}`} />
                {it.label}
              </span>
            ))}
          </div>
          {selectedIso && <DayDetail date={selectedIso} requests={requests} holidays={holidays} />}
        </div>
      </div>
    </>
  );
}
