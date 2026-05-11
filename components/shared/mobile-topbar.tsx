import { type ReactNode } from "react";
import { SyncStatusBadge } from "@/components/shared/sync-status-badge";

interface MobileTopbarProps {
  title: string;
  rightAction?: ReactNode;
}

export function MobileTopbar({ title, rightAction }: MobileTopbarProps) {
  return (
    <header className="flex h-14 items-center gap-3 border-b border-(--es-neutral-100) px-4">
      <span className="flex-1 text-base font-semibold">{title}</span>
      {rightAction}
      <SyncStatusBadge />
    </header>
  );
}
