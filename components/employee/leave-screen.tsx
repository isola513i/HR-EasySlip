"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MobileTopbar } from "@/components/shared/mobile-topbar";

type LeaveType = "SICK" | "PERSONAL" | "ANNUAL" | "LWP";
type HalfDay = "FULL" | "MORNING" | "AFTERNOON";

const leaveTypes = [
  { key: "SICK" as const, label: "Sick", sub: "Sick leave", balance: "28 / 30" },
  { key: "PERSONAL" as const, label: "Personal", sub: "Personal leave", balance: "2 / 3" },
  { key: "ANNUAL" as const, label: "Annual", sub: "Annual leave", balance: "4 / 4" },
  { key: "LWP" as const, label: "LWP", sub: "Leave without pay", balance: "∞" },
];

const durations = [
  { key: "FULL" as const, label: "Full day", sub: "Full day" },
  { key: "MORNING" as const, label: "Morning", sub: "09:00–13:00" },
  { key: "AFTERNOON" as const, label: "Afternoon", sub: "13:00–18:00" },
];

export function LeaveScreen() {
  const [type, setType] = useState<LeaveType>("SICK");
  const [half, setHalf] = useState<HalfDay>("FULL");

  return (
    <>
      <MobileTopbar title="Leave request" backHref="/employee/today" />

      <div className="flex flex-col gap-4 p-4">
        {/* Leave type picker */}
        <div>
          <label className="mb-2 block text-[13px] font-medium">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {leaveTypes.map((t) => {
              const sel = type === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={cn(
                    "rounded-[10px] p-3 text-left transition-colors",
                    sel
                      ? "border-[1.5px] border-[var(--es-accent-600)] bg-[var(--es-accent-50)]"
                      : "border border-[var(--es-neutral-300)] bg-card",
                  )}
                >
                  <div className="text-sm font-semibold">{t.label}</div>
                  <div className="text-[11px] text-muted-foreground">{t.sub}</div>
                  <div className={cn("tabular-nums mt-1 text-[11px] font-semibold", sel ? "text-[var(--es-accent-700)]" : "text-muted-foreground")}>
                    Balance: {t.balance}
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
            {["From", "To"].map((l, i) => (
              <div key={l} className="rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
                <div className="tabular-nums mt-0.5 text-[15px] font-semibold">
                  {i === 0 ? "22 Apr 2026" : "23 Apr 2026"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="mb-2 block text-[13px] font-medium">Duration</label>
          <div className="grid grid-cols-3 gap-2">
            {durations.map((o) => {
              const sel = half === o.key;
              return (
                <button
                  key={o.key}
                  onClick={() => setHalf(o.key)}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-lg px-2 py-2.5 text-[13px] font-semibold transition-colors",
                    sel
                      ? "border-[1.5px] border-[var(--es-accent-600)] bg-[var(--es-accent-600)] text-white"
                      : "border border-[var(--es-neutral-300)] bg-card text-foreground",
                  )}
                >
                  <span>{o.label}</span>
                  <span className={cn("text-[10px] font-normal", sel ? "opacity-85" : "opacity-60")}>{o.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">Reason</label>
          <textarea
            placeholder="Enter reason..."
            className="w-full resize-none rounded-lg border border-[var(--es-neutral-300)] bg-card px-2.5 py-2.5 text-sm focus:border-[var(--es-accent-600)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            rows={3}
            defaultValue="Medical appointment"
          />
        </div>

        {/* Attachment */}
        <button className="flex items-center gap-2.5 rounded-lg border border-dashed border-[var(--es-neutral-300)] bg-[var(--es-neutral-50)] px-3 py-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted">
          <Paperclip className="size-4" />
          Attach medical certificate (optional)
        </button>

        {/* Summary */}
        <div className="flex items-center justify-between rounded-[10px] border border-[var(--es-accent-200)] bg-[var(--es-accent-50)] p-3 text-[12px] text-[var(--es-accent-800)]">
          <div>
            <div className="font-semibold">Leave calculation</div>
            <div className="tabular-nums text-[11px] opacity-80">22–23 Apr 2026 · excludes holidays</div>
          </div>
          <div className="tabular-nums text-[22px] font-bold">
            2.0<span className="text-xs opacity-70"> days</span>
          </div>
        </div>

        {/* Submit */}
        <Button
          className="w-full"
          size="lg"
          onClick={() => toast.success("Request submitted. Awaiting manager approval.")}
        >
          Submit request
        </Button>
      </div>
    </>
  );
}
