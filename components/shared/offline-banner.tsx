"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineBanner() {
  const { isOnline, pendingCount } = useOnlineStatus();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="animate-in slide-in-from-top flex items-center justify-center gap-2 bg-[var(--es-warning-100)] px-4 py-2 text-[13px] font-medium text-[var(--es-warning-700)]">
      <WifiOff className="size-4" />
      {!isOnline ? (
        <span>
          You&apos;re offline.
          {pendingCount > 0 && ` ${pendingCount} change(s) queued for sync.`}
        </span>
      ) : (
        <span>Syncing {pendingCount} queued change(s)...</span>
      )}
    </div>
  );
}
