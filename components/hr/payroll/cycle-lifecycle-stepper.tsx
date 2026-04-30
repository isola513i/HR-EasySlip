"use client";

import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import type { PayrollCycle } from "@/hooks/use-payroll";

type StepState = "complete" | "active" | "pending";

interface Props {
  cycle: PayrollCycle | null;
}

function deriveStates(cycle: PayrollCycle | null): [StepState, StepState, StepState, StepState] {
  if (!cycle) return ["pending", "pending", "pending", "pending"];
  if (cycle.status === "OPEN") return ["active", "pending", "pending", "pending"];
  if (cycle.status === "LOCKED") return ["complete", "complete", "active", "pending"];
  if (cycle.status === "EXPORTED") return ["complete", "complete", "complete", "active"];
  return ["pending", "pending", "pending", "pending"];
}

export function CycleLifecycleStepper({ cycle }: Props) {
  const t = useT();
  const states = deriveStates(cycle);
  const steps = [
    { title: t.hr.payroll.stepCollect, sub: t.hr.payroll.stepCollectSub },
    { title: t.hr.payroll.stepLock, sub: t.hr.payroll.stepLockSub },
    { title: t.hr.payroll.stepExport, sub: t.hr.payroll.stepExportSub },
    { title: t.hr.payroll.stepDone, sub: t.hr.payroll.stepDoneSub },
  ];

  const stateLabel: Record<StepState, string> = {
    complete: t.hr.payroll.stepStatus.complete,
    active: t.hr.payroll.stepStatus.active,
    pending: t.hr.payroll.stepStatus.pending,
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
      <div className="border-b border-border px-5 py-4">
        <div className="text-base font-semibold">{t.hr.payroll.lifecycleTitle}</div>
        <div className="mt-0.5 text-[12px] text-muted-foreground">{t.hr.payroll.lifecycleSubtitle}</div>
      </div>

      <div className="space-y-2.5 p-4">
        {steps.map((s, i) => {
          const state = states[i];
          return (
            <div
              key={s.title}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3.5 transition-colors",
                state === "complete" && "border-[var(--es-success-200,#bbf7d0)] bg-[var(--es-success-50)]",
                state === "active" && "border-[var(--es-accent-300)] bg-[var(--es-accent-50)] ring-1 ring-[var(--es-accent-300)]",
                state === "pending" && "border-border bg-card",
              )}
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-lg text-[13px] font-bold tabular-nums",
                  state === "complete" && "bg-[var(--es-success-500)] text-white",
                  state === "active" && "bg-[var(--es-accent-600)] text-white",
                  state === "pending" && "bg-[var(--es-neutral-100)] text-[var(--es-neutral-500)]",
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold">{s.title}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">{s.sub}</div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  state === "complete" && "bg-[var(--es-success-100)] text-[var(--es-success-700)]",
                  state === "active" && "bg-[var(--es-accent-100)] text-[var(--es-accent-700)]",
                  state === "pending" && "bg-[var(--es-neutral-100)] text-[var(--es-neutral-700)]",
                )}
              >
                {stateLabel[state]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
