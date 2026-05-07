"use client";

import { toast } from "sonner";
import { OfflineQueuedError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { MobileTopbar } from "@/components/shared/mobile-topbar";
import { SectionLabel } from "@/components/shared/section-label";
import { InfoBanner } from "@/components/shared/info-banner";
import { useOTRequests } from "@/hooks/use-ot-requests";
import { useT } from "@/lib/i18n/locale-context";

import type { OTType } from "@/hooks/use-ot-requests";

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

  const needsTimeRange = otType !== "WEEKDAY";
  const infoBanner = otType === "WEEKDAY"
    ? t.ot.weekdayInfo
    : otType === "HOLIDAY"
    ? t.ot.holidayInfo
    : t.ot.holidayWorkInfo;

  return (
    <>
      <MobileTopbar title={t.ot.title} />

      <div className="flex flex-col gap-5 p-4">
<Tabs value={otType} onValueChange={(v) => setOTType(v as OTType)}>
          <TabsList className="h-11 w-full rounded-full p-1">
            <TabsTrigger value="WEEKDAY" className="flex-1 rounded-full text-xs">
              {t.ot.weekday}
            </TabsTrigger>
            <TabsTrigger value="HOLIDAY" className="flex-1 rounded-full text-xs">
              {t.ot.holiday}
            </TabsTrigger>
            <TabsTrigger value="HOLIDAY_WORK" className="flex-1 rounded-full text-xs">
              {t.ot.holidayWork}
            </TabsTrigger>
          </TabsList>
        </Tabs>

<div>
          <SectionLabel htmlFor="ot-date">{t.ot.date}</SectionLabel>
          <DatePicker value={date} onChange={setDate} className="h-11 w-full rounded-xl" />
        </div>

{needsTimeRange && (
          <>
            <div>
              <SectionLabel htmlFor="ot-start">{t.ot.assignedStart}</SectionLabel>
              <input
                id="ot-start"
                type="datetime-local"
                value={assignedStart}
                onChange={(e) => setAssignedStart(e.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--es-neutral-300)] bg-card px-3 text-sm outline-none transition-colors hover:border-[var(--es-neutral-400)] focus:border-[var(--es-accent-400)] focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <div>
              <SectionLabel htmlFor="ot-end">{t.ot.assignedEnd}</SectionLabel>
              <input
                id="ot-end"
                type="datetime-local"
                value={assignedEnd}
                min={assignedStart}
                onChange={(e) => setAssignedEnd(e.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--es-neutral-300)] bg-card px-3 text-sm outline-none transition-colors hover:border-[var(--es-neutral-400)] focus:border-[var(--es-accent-400)] focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
          </>
        )}
        <InfoBanner tone="accent">{infoBanner}</InfoBanner>

<div>
          <SectionLabel htmlFor="ot-reason">{t.ot.reason}</SectionLabel>
          <Textarea
            id="ot-reason"
            placeholder={t.ot.reasonPlaceholder}
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="bg-[var(--es-neutral-50)]"
          />
        </div>

<Button
          className="w-full rounded-full"
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
