"use client";

import { useState } from "react";
import { Plus, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/shared/status-pill";
import { ExpenseSubmitDialog } from "./expense-submit-dialog";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import { useMyExpenses, type ExpenseStatus } from "@/hooks/use-expense";

const STATUS_TONE: Record<ExpenseStatus, "info" | "success" | "error" | "neutral"> = {
  PENDING: "info",
  APPROVED: "success",
  REJECTED: "error",
  CANCELLED: "neutral",
};

export function ExpenseScreen() {
  const t = useT();
  const fmt = useFormat();
  const { items, isLoading, error, cancel } = useMyExpenses();
  const [open, setOpen] = useState(false);

  const handleCancel = async (id: string) => {
    try {
      await cancel(id);
      toast.success(t.hr.expense.cancelSuccess);
    } catch {
      toast.error(t.hr.expense.cancelFailed);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 pb-24">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">{t.hr.expense.pageTitle}</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{t.hr.expense.pageSubtitle}</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="size-4" /> {t.hr.expense.newBtn}
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      )}
      {!isLoading && error && (
        <div className="py-12 text-center text-sm text-destructive">{error}</div>
      )}
      {!isLoading && !error && items.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <Receipt className="size-10 opacity-40" />
          <p className="text-sm">{t.hr.expense.empty}</p>
        </div>
      )}
      {!isLoading && !error && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((it) => (
            <li
              key={it.id}
              className="rounded-xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-base font-semibold tabular-nums">
                    ฿{Number(it.amountTHB).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground">
                    {t.hr.expense.categories[it.category]} · {fmt.formatShortDate(it.occurredOn)}
                  </div>
                </div>
                <StatusPill tone={STATUS_TONE[it.status]}>
                  {t.hr.expense.statuses[it.status]}
                </StatusPill>
              </div>
              <p className="mt-2 text-[13px] text-foreground/90 whitespace-pre-line">
                {it.description}
              </p>
              {it.rejectReason && (
                <p className="mt-2 rounded-lg bg-[var(--es-error-50)] px-3 py-2 text-[12px] text-[var(--es-error-700)]">
                  {it.rejectReason}
                </p>
              )}
              {it.status === "PENDING" && (
                <div className="mt-3 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => handleCancel(it.id)}>
                    {t.hr.expense.cancelClaim}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ExpenseSubmitDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
