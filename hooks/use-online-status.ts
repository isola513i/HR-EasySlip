"use client";

import { useState, useEffect, useCallback } from "react";
import { dequeueAll, getPendingCount } from "@/lib/offline/offline-queue";
import { toast } from "sonner";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true); // always true on SSR, sync in useEffect
  const [pendingCount, setPendingCount] = useState(0);

  const refreshCount = useCallback(async () => {
    try { setPendingCount(await getPendingCount()); } catch { /* IndexedDB unavailable */ }
  }, []);

  const replayQueue = useCallback(async () => {
    try {
      const pending = await dequeueAll();
      if (pending.length === 0) return;
      let synced = 0;
      for (const req of pending) {
        try {
          await fetch(req.url, {
            method: req.method,
            headers: { "Content-Type": "application/json" },
            body: req.body,
          });
          synced++;
        } catch { /* will retry next time */ }
      }
      if (synced > 0) toast.success(`${synced} queued request(s) synced`);
      await refreshCount();
    } catch { /* IndexedDB unavailable */ }
  }, [refreshCount]);

  useEffect(() => {
    setIsOnline(navigator.onLine); // sync actual status on mount
    const goOnline = () => { setIsOnline(true); replayQueue(); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    refreshCount();
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, [replayQueue, refreshCount]);

  return { isOnline, pendingCount };
}
