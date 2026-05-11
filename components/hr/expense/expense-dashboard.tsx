"use client";

import { Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/shared/status-pill";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import { useHRExpenses, EXPENSE_STATUS_TONE } from "@/hooks/use-expense";

const PAGE_LIMIT = 100;

export function ExpenseDashboard() {
  const t = useT();
  const fmt = useFormat();
  const { items, total, isLoading, error } = useHRExpenses();
  const truncated = total > items.length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight">{t.hr.expense.pageTitle}</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{t.hr.expense.pageSubtitle}</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
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
        <>
          {truncated && (
            <div className="rounded-lg bg-(--es-warn-50) px-3 py-2 text-[12px] text-(--es-warn-700)">
              {t.hr.expense.showingFirstN.replace("{shown}", String(PAGE_LIMIT)).replace("{total}", String(total))}
            </div>
          )}
          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.id} className="rounded-xl border border-border bg-card p-4 shadow-(--es-shadow-sm)">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">
                      {it.employee.firstNameTh} {it.employee.lastNameTh}
                      <span className="ml-2 font-mono text-[11px] text-muted-foreground">{it.employee.employeeCode}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
                      <span>{t.hr.expense.categories[it.category]}</span>
                      <span>·</span>
                      <span>{fmt.formatShortDate(it.occurredOn)}</span>
                      <span>·</span>
                      <span className="font-medium tabular-nums text-foreground">{fmt.formatTHB(it.amountTHB)}</span>
                    </div>
                  </div>
                  <StatusPill tone={EXPENSE_STATUS_TONE[it.status]}>{t.hr.expense.statuses[it.status]}</StatusPill>
                </div>
                <p className="mt-2 text-[13px] text-foreground/90 whitespace-pre-line">{it.description}</p>
                {it.rejectReason && (
                  <p className="mt-2 rounded-lg bg-(--es-error-50) px-3 py-2 text-[12px] text-(--es-error-700)">
                    {it.rejectReason}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
