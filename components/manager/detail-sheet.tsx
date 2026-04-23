"use client";

import { ShieldCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatLeaveType } from "@/lib/utils";
import type { ApprovalRow } from "@/types/manager";

interface Props {
  row: ApprovalRow | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function DetailSheet({ row, onClose, onApprove, onReject }: Props) {
  if (!row) return null;

  const name = `${row.employee.firstNameTh} ${row.employee.lastNameTh}`;
  const fields = [
    ["Type", formatLeaveType(row.leaveType)],
    ["Dates", `${new Date(row.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} – ${new Date(row.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`],
    ["Duration", `${row.daysRequested} days (${row.halfDay.toLowerCase()})`],
    ["Reason", row.reason],
    ["Submitted", new Date(row.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })],
  ] as const;

  return (
    <Sheet open={!!row} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[480px] sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>Leave Request</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto px-4 pb-4">
          <div className="flex items-center gap-3 border-b border-[var(--es-neutral-100)] py-3">
            <div className="es-brand-gradient grid size-11 place-items-center rounded-full font-bold text-white">
              {row.employee.firstNameTh.charAt(0)}
            </div>
            <div>
              <div className="font-semibold">{name}</div>
              <div className="text-xs text-muted-foreground">
                {row.employee.employeeCode} · Direct report
              </div>
            </div>
          </div>

          {fields.map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-[var(--es-neutral-100)] py-2.5 text-[13px]">
              <span className="text-muted-foreground">{k}</span>
              <span className="max-w-[60%] text-right font-medium">{v}</span>
            </div>
          ))}

          <div className="my-4 flex gap-2.5 rounded-lg border border-border bg-[var(--es-neutral-50)] p-3.5">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="text-[13px] leading-relaxed">
              <div className="font-semibold">Request info</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {row.daysRequested} days requested · {formatLeaveType(row.leaveType)}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { onReject(row.id); onClose(); }}
              className="flex-1 rounded-md border border-[var(--es-error-500)] bg-card py-3 text-sm font-semibold text-[var(--es-error-500)] transition-colors hover:bg-[var(--es-error-50)]"
            >
              Reject
            </button>
            <button
              onClick={() => { onApprove(row.id); onClose(); }}
              className="flex-[2] rounded-md bg-[var(--es-accent-600)] py-3 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(61,70,204,0.2)] transition-colors hover:bg-[var(--es-accent-700)]"
            >
              Approve request
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
