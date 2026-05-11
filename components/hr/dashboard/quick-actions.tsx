"use client";

import Link from "next/link";
import { UserPlus, FileText, Calendar, DollarSign, type LucideIcon } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

interface ActionTile {
  href: string;
  label: string;
  icon: LucideIcon;
  filled?: boolean;
  tone?: "accent" | "error";
}

function Tile({ tile }: { tile: ActionTile }) {
  const filled = tile.filled;
  const tone = tile.tone ?? "accent";
  const filledBg =
    tone === "error"
      ? "bg-[var(--es-error-500)] text-white"
      : "bg-[var(--es-accent-600)] text-white";
  const ghostIcon =
    tone === "error"
      ? "bg-[var(--es-error-50)] text-[var(--es-error-500)]"
      : "bg-[var(--es-accent-50)] text-[var(--es-accent-600)]";

  return (
    <Link
      href={tile.href}
      className="group/tile flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-center shadow-[var(--es-shadow-sm)] transition-all hover:-translate-y-0.5 hover:border-[var(--es-accent-300)] hover:shadow-[var(--es-shadow-md)]"
    >
      <div className={`grid size-11 place-items-center rounded-xl ${filled ? filledBg : ghostIcon}`}>
        <tile.icon className="size-5" />
      </div>
      <span className="text-[12px] font-medium leading-tight">{tile.label}</span>
    </Link>
  );
}

export function QuickActions() {
  const t = useT();
  const k = t.hr.dashboard.quickActions;

  const tiles: ActionTile[] = [
    { href: "/hr/employees", label: k.addEmployee, icon: UserPlus, filled: true },
    { href: "/hr/reports", label: k.viewReports, icon: FileText },
    { href: "/hr/leave", label: k.approveLeave, icon: Calendar },
    { href: "/hr/payroll", label: k.runPayroll, icon: DollarSign, filled: true },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--es-shadow-sm)]">
      <div className="mb-4 text-base font-semibold">{t.hr.dashboard.quickActionsTitle}</div>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => <Tile key={tile.href} tile={tile} />)}
      </div>
    </div>
  );
}
