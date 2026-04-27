"use client";

import { useState } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineQueuePanel } from "./offline-queue-panel";

export function SyncStatusBadge() {
  const { isOnline, pendingCount, pendingItems, cancelItem, manualRetry } = useOnlineStatus();
  const [panelOpen, setPanelOpen] = useState(false);

  if (isOnline && pendingCount === 0) return null;

  return (
    <>
      <button
        onClick={() => setPanelOpen(true)}
        className="relative rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
        aria-label="Sync status"
      >
        {!isOnline ? (
          <CloudOff className="size-4 text-destructive" />
        ) : pendingCount > 0 ? (
          <RefreshCw className="size-4 animate-spin" />
        ) : (
          <Cloud className="size-4" />
        )}
        {pendingCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
            {pendingCount}
          </span>
        )}
      </button>

      <OfflineQueuePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        items={pendingItems}
        isOnline={isOnline}
        onCancel={cancelItem}
        onRetry={manualRetry}
      />
    </>
  );
}
