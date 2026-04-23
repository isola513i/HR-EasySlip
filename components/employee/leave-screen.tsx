"use client";

import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MobileTopbar } from "@/components/shared/mobile-topbar";
import { useLeaveForm } from "@/hooks/use-leave-form";

const LEAVE_TYPES = [
  { key: "SICK" as const, label: "Sick", sub: "Sick leave" },
  { key: "PERSONAL" as const, label: "Personal", sub: "Personal leave" },
  { key: "ANNUAL" as const, label: "Annual", sub: "Annual leave" },
  { key: "LEAVE_WITHOUT_PAY" as const, label: "LWP", sub: "Leave without pay" },
];

const DURATIONS = [
  { key: "FULL" as const, label: "Full day", sub: "Full day" },
  { key: "MORNING" as const, label: "Morning", sub: "09:00–13:00" },
  { key: "AFTERNOON" as const, label: "Afternoon", sub: "13:00–18:00" },
];

export function LeaveScreen() {
  const {
    leaveType, setLeaveType, halfDay, setHalfDay,
    startDate, setStartDate, endDate, setEndDate,
    reason, setReason, preview, isSubmitting,
    isLoadingQuotas, quotaError, submit, getBalance,
  } = useLeaveForm();

  const handleSubmit = async () => {
    try {
      const result = await submit();
      if (result) toast.success("Request submitted. Awaiting manager approval.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    }
  };

  return (
    <>
      <MobileTopbar title="Leave request" backHref="/employee/today" />

      <div className="flex flex-col gap-4 p-4">
        {/* Leave type picker */}
        <div>
          <label className="mb-2 block text-[13px] font-medium">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {LEAVE_TYPES.map((t) => {
              const sel = leaveType === t.key;
              return (
                <button key={t.key} onClick={() => setLeaveType(t.key)} className={cn("rounded-[10px] p-3 text-left transition-colors", sel ? "border-[1.5px] border-[var(--es-accent-600)] bg-[var(--es-accent-50)]" : "border border-[var(--es-neutral-300)] bg-card")}>
                  <div className="text-sm font-semibold">{t.label}</div>
                  <div className="text-[11px] text-muted-foreground">{t.sub}</div>
                  <div className={cn("tabular-nums mt-1 text-[11px] font-semibold", sel ? "text-[var(--es-accent-700)]" : "text-muted-foreground")}>
                    {isLoadingQuotas ? "Loading..." : quotaError ? "Error" : `Balance: ${getBalance(t.key)}`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {/* Date range */}
        <div>
          <label className="mb-2 block text-[13px] font-medium">Date range</label>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">From</div>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); if (!endDate || e.target.value > endDate) setEndDate(e.target.value); }} className="mt-0.5 w-full border-none bg-transparent text-[15px] font-semibold outline-none" />
            </div>
            <div className="rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">To</div>
              <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="mt-0.5 w-full border-none bg-transparent text-[15px] font-semibold outline-none" />
            </div>
          </div>
        </div>
        {/* Duration */}
        <div>
          <label className="mb-2 block text-[13px] font-medium">Duration</label>
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
          <label className="mb-1.5 block text-[13px] font-medium">Reason</label>
          <Textarea placeholder="Enter reason..." rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <button className="flex items-center gap-2.5 rounded-lg border border-dashed border-[var(--es-neutral-300)] bg-[var(--es-neutral-50)] px-3 py-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted">
          <Paperclip className="size-4" /> Attach medical certificate (optional)
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
              <div className="font-semibold">Leave calculation</div>
              <div className="tabular-nums text-[11px] opacity-80">
                {startDate} – {endDate} · excludes holidays
              </div>
            </div>
            <div className="tabular-nums text-[22px] font-bold">
              {preview.days}<span className="text-xs opacity-70"> days</span>
            </div>
          </div>
        )}

        {/* Submit */}
        <Button
          className="w-full"
          size="lg"
          disabled={isSubmitting || !startDate || !endDate || !reason.trim() || (preview !== null && !preview.sufficient)}
          onClick={handleSubmit}
        >
          {isSubmitting ? "Submitting..." : "Submit request"}
        </Button>
      </div>
    </>
  );
}
