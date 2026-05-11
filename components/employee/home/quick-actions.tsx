import Link from "next/link";
import { CalendarDays, Timer, FileText, Receipt, type LucideIcon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface QuickActionsProps {
  dict: Dictionary;
}

export function QuickActions({ dict }: QuickActionsProps) {
  const e = dict.employee;
  const items: { href: string; icon: LucideIcon; label: string }[] = [
    { href: "/employee/leave", icon: CalendarDays, label: e.requestLeave },
    { href: "/employee/ot", icon: Timer, label: e.requestOT },
    { href: "/employee/timesheet", icon: FileText, label: e.timesheet },
    { href: "/employee/expense", icon: Receipt, label: e.requestExpense },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className="flex min-h-[96px] flex-col items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-colors active:bg-muted/60"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-[var(--es-accent-50)]">
            <Icon className="size-4.5 text-[var(--es-accent-600)]" strokeWidth={2} />
          </span>
          <div className="text-sm font-bold leading-tight text-foreground">{label}</div>
        </Link>
      ))}
    </div>
  );
}
