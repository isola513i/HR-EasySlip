"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useT } from "@/lib/i18n/locale-context";

export function OfflineBanner() {
  const t = useT();
  const { isOnline, pendingCount } = useOnlineStatus();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="animate-in slide-in-from-top flex items-center justify-center gap-2 bg-(--es-warning-100) px-4 py-2 text-[13px] font-medium text-(--es-warning-700)">
      <WifiOff className="size-4" />
      {!isOnline ? (
        <span>
          {t.offline.youreOffline}
          {pendingCount > 0 && ` ${t.offline.queuedChanges.replace("{count}", String(pendingCount))}`}
        </span>
      ) : (
        <span>{t.offline.syncing.replace("{count}", String(pendingCount))}</span>
      )}
    </div>
  );
}
