"use client";

import { ShieldCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ApprovalRow } from "@/types/manager";

interface Props {
  row: ApprovalRow | null;
  onClose: () => void;
}

export function DetailSheet({ row, onClose }: Props) {
  if (!row) return null;

  const fields = [
    ["Type", row.type],
    ["Dates", row.dates],
    ["Duration", `${row.days} days`],
    ["Reason", row.reason],
    ["Submitted", row.submitted],
  ] as const;

  return (
    <Sheet open={!!row} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[480px] sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>Leave Request #{row.id}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto px-4 pb-4">
          {/* Employee info */}
          <div className="flex items-center gap-3 border-b border-[var(--es-neutral-100)] py-3">
            <div className="es-brand-gradient grid size-11 place-items-center rounded-full font-bold text-white">
              {row.name.charAt(0)}
            </div>
            <div>
              <div className="font-semibold">{row.name}</div>
              <div className="text-xs text-muted-foreground">
                {row.code} · Engineering · Direct report
              </div>
            </div>
          </div>

          {/* Fields */}
          {fields.map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between border-b border-[var(--es-neutral-100)] py-2.5 text-[13px]"
            >
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}

          {/* Quota check alert */}
          <div className="my-4 flex gap-2.5 rounded-lg border border-border bg-[var(--es-neutral-50)] p-3.5">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="text-[13px] leading-relaxed">
              <div className="font-semibold">Quota check</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                4.0 of 4.0 days available · sufficient · 1.0 remaining after
                approval.
              </div>
            </div>
          </div>

          {/* Comment */}
          <textarea
            placeholder="Add a comment (optional)..."
            rows={3}
            className="mb-3.5 w-full resize-none rounded-md border border-[var(--es-neutral-300)] bg-card px-2.5 py-2.5 text-[13px] focus:border-[var(--es-accent-600)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />

          {/* Actions */}
          <div className="flex gap-2">
            <button className="flex-1 rounded-md border border-[var(--es-error-500)] bg-card py-3 text-sm font-semibold text-[var(--es-error-500)] transition-colors hover:bg-[var(--es-error-50)]">
              Reject
            </button>
            <button className="flex-[2] rounded-md bg-[var(--es-accent-600)] py-3 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(61,70,204,0.2)] transition-colors hover:bg-[var(--es-accent-700)]">
              Approve request
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
