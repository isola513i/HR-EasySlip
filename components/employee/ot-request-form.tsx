"use client";

import { toast } from "sonner";
import { OfflineQueuedError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { MobileTopbar } from "@/components/shared/mobile-topbar";
import { useOTRequests } from "@/hooks/use-ot-requests";
import { useT } from "@/lib/i18n/locale-context";

type OTType = "WEEKDAY" | "HOLIDAY";

export function OTRequestForm() {
  const t = useT();
  const {
    otType, setOTType,
    date, setDate,
    assignedStart, setAssignedStart,
    assignedEnd, setAssignedEnd,
    reason, setReason,
    isSubmitting,
    submit,
  } = useOTRequests();

  const handleSubmit = async () => {
    try {
      const result = await submit() as { warnings?: { code: string; message: string }[] } | null;
      if (result) {
        toast.success(t.ot.submitSuccess);
        if (result.warnings?.length) {
          for (const w of result.warnings) toast.warning(w.message);
        }
      }
    } catch (err) {
      if (err instanceof OfflineQueuedError) {
        toast.info(t.clock.offlineQueued, { duration: 6000 });
        return;
      }
      toast.error(err instanceof Error ? err.message : t.ot.submitFailed);
    }
  };

  const canSubmit =
    date &&
    reason.trim() &&
    (otType === "WEEKDAY" || (assignedStart && assignedEnd));

  return (
    <>
      <MobileTopbar title={t.ot.title} backHref="/employee/today" />

      <div className="flex flex-col gap-4 p-4">
        {/* OT type tabs */}
        <Tabs value={otType} onValueChange={(v) => setOTType(v as OTType)}>
          <TabsList className="w-full">
            <TabsTrigger value="WEEKDAY" className="flex-1">{t.ot.weekday}</TabsTrigger>
            <TabsTrigger value="HOLIDAY" className="flex-1">{t.ot.holiday}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Date */}
        <div className="space-y-1.5">
          <label htmlFor="ot-date" className="block text-[13px] font-medium">{t.ot.date}</label>
          <DatePicker value={date} onChange={setDate} className="w-full" />
        </div>

        {/* Weekday info / Holiday fields */}
        {otType === "WEEKDAY" ? (
          <div className="rounded-[10px] border border-[var(--es-accent-200)] bg-[var(--es-accent-50)] p-3 text-[12px] text-[var(--es-accent-800)]">
            {t.ot.weekdayInfo}
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <label htmlFor="ot-start" className="block text-[13px] font-medium">
                {t.ot.assignedStart}
              </label>
              <input
                id="ot-start"
                type="datetime-local"
                value={assignedStart}
                onChange={(e) => setAssignedStart(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 text-[13px] outline-none transition-colors hover:border-[var(--es-neutral-400)] focus:border-[var(--es-accent-400)] focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ot-end" className="block text-[13px] font-medium">
                {t.ot.assignedEnd}
              </label>
              <input
                id="ot-end"
                type="datetime-local"
                value={assignedEnd}
                min={assignedStart}
                onChange={(e) => setAssignedEnd(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 text-[13px] outline-none transition-colors hover:border-[var(--es-neutral-400)] focus:border-[var(--es-accent-400)] focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <div className="rounded-[10px] border border-[var(--es-accent-200)] bg-[var(--es-accent-50)] p-3 text-[12px] text-[var(--es-accent-800)]">
              {t.ot.holidayInfo}
            </div>
          </>
        )}

        {/* Reason */}
        <div className="space-y-1.5">
          <label htmlFor="ot-reason" className="block text-[13px] font-medium">
            {t.ot.reason}
          </label>
          <Textarea
            id="ot-reason"
            placeholder={t.ot.reasonPlaceholder}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {/* Submit */}
        <Button
          className="w-full"
          size="lg"
          disabled={isSubmitting || !canSubmit}
          onClick={handleSubmit}
        >
          {isSubmitting ? t.ot.submitting : t.ot.submit}
        </Button>
      </div>
    </>
  );
}
