"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusPill } from "@/components/shared/status-pill";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import { useOffboarding, type OffboardingRecord, type OffboardingStatus } from "@/hooks/use-offboarding";

const STATUS_TONE: Record<OffboardingStatus, "info" | "success" | "neutral"> = {
  IN_PROGRESS: "info",
  COMPLETED: "success",
  CANCELLED: "neutral",
};

interface Props {
  record: OffboardingRecord;
  onComplete: () => void;
}

export function OffboardingCard({ record, onComplete }: Props) {
  const t = useT();
  const fmt = useFormat();
  const { toggleItem } = useOffboarding();
  const allDone = record.items.every((it) => it.completed);
  const doneCount = record.items.filter((it) => it.completed).length;
  const isLocked = record.status !== "IN_PROGRESS";

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-base font-semibold">
            {record.employee.firstNameTh} {record.employee.lastNameTh}
            <span className="ml-2 font-mono text-[12px] text-muted-foreground">{record.employee.employeeCode}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
            <span>{t.hr.offboarding.reasons[record.reason]}</span>
            <span>·</span>
            <span>{t.hr.offboarding.lastDay}: <span className="text-foreground tabular-nums">{fmt.formatShortDate(record.lastDay)}</span></span>
          </div>
        </div>
        <StatusPill tone={STATUS_TONE[record.status]}>{t.hr.offboarding.statuses[record.status]}</StatusPill>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[var(--es-success-500)] transition-all"
            style={{ width: `${(doneCount / record.items.length) * 100}%` }}
          />
        </div>
        <span className="tabular-nums">{doneCount}/{record.items.length}</span>
      </div>

      <ul className="mt-3 space-y-1.5">
        {record.items.map((it) => {
          const itemLabels = t.hr.offboarding.items as Record<string, string>;
          const label = itemLabels[it.key] ?? it.label ?? it.key;
          return (
            <li key={it.key} className="flex items-start gap-2 rounded-lg p-1.5 hover:bg-muted/40">
              <Checkbox
                checked={it.completed}
                disabled={isLocked}
                onCheckedChange={(v) => toggleItem(record.id, it.key, !!v)}
                aria-label={label}
                className="mt-0.5"
              />
              <span className={`text-sm ${it.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {label}
              </span>
            </li>
          );
        })}
      </ul>

      {!isLocked && (
        <Button
          onClick={onComplete}
          disabled={!allDone}
          variant="outline"
          className="mt-3 w-full gap-1.5"
        >
          <CheckCircle2 className="size-4" /> {t.hr.offboarding.completeBtn}
        </Button>
      )}

      {record.notes && (
        <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
          {record.notes}
        </div>
      )}
    </div>
  );
}
