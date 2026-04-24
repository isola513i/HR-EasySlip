"use client";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MobileTopbar } from "@/components/shared/mobile-topbar";
import { useOTRequests } from "@/hooks/use-ot-requests";

const OT_TABS = [
  { key: "WEEKDAY" as const, label: "Weekday OT" },
  { key: "HOLIDAY" as const, label: "Holiday OT" },
];

export function OTRequestForm() {
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
      const result = await submit();
      if (result) toast.success("OT request submitted. Awaiting approval.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    }
  };

  const canSubmit =
    date &&
    reason.trim() &&
    (otType === "WEEKDAY" || (assignedStart && assignedEnd));

  return (
    <>
      <MobileTopbar title="OT Request" backHref="/employee/today" />

      <div className="flex flex-col gap-4 p-4">
        {/* OT type tabs */}
        <div className="grid grid-cols-2 gap-2">
          {OT_TABS.map((tab) => {
            const sel = otType === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setOTType(tab.key)}
                className={cn(
                  "rounded-lg py-2.5 text-[13px] font-semibold transition-colors",
                  sel
                    ? "border-[1.5px] border-[var(--es-accent-600)] bg-[var(--es-accent-600)] text-white"
                    : "border border-[var(--es-neutral-300)] bg-card text-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Date */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">Date</label>
          <div className="rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border-none bg-transparent text-[15px] font-semibold outline-none"
            />
          </div>
        </div>

        {/* Weekday info / Holiday fields */}
        {otType === "WEEKDAY" ? (
          <div className="rounded-[10px] border border-[var(--es-accent-200)] bg-[var(--es-accent-50)] p-3 text-[12px] text-[var(--es-accent-800)]">
            OT starts at 18:00. Must work at least 30 min. Hours calculated
            from your clock-out.
          </div>
        ) : (
          <>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">
                Assigned Start
              </label>
              <div className="rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-2">
                <input
                  type="datetime-local"
                  value={assignedStart}
                  onChange={(e) => setAssignedStart(e.target.value)}
                  className="w-full border-none bg-transparent text-[15px] font-semibold outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">
                Assigned End
              </label>
              <div className="rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-2">
                <input
                  type="datetime-local"
                  value={assignedEnd}
                  min={assignedStart}
                  onChange={(e) => setAssignedEnd(e.target.value)}
                  className="w-full border-none bg-transparent text-[15px] font-semibold outline-none"
                />
              </div>
            </div>
            <div className="rounded-[10px] border border-[var(--es-accent-200)] bg-[var(--es-accent-50)] p-3 text-[12px] text-[var(--es-accent-800)]">
              Assigned by your manager. OT hours capped within this window.
            </div>
          </>
        )}

        {/* Reason */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">
            Reason
          </label>
          <Textarea
            placeholder="Enter reason..."
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
          {isSubmitting ? "Submitting..." : "Submit request"}
        </Button>
      </div>
    </>
  );
}
