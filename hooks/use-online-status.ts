"use client";

import { useState, useEffect, useCallback } from "react";
import { dequeueAll, getAllPending, removeById, type PendingRequest } from "@/lib/offline/offline-queue";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/locale-context";

export function useOnlineStatus() {
  const t = useT();
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingItems, setPendingItems] = useState<PendingRequest[]>([]);

  const refreshCount = useCallback(async () => {
    try {
      const items = await getAllPending();
      setPendingCount(items.length);
      setPendingItems(items);
    } catch { /* IndexedDB unavailable */ }
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
      if (synced > 0) toast.success(t.clock.offlineSynced.replace("{count}", String(synced)));
      await refreshCount();
    } catch { /* IndexedDB unavailable */ }
  }, [refreshCount, t.clock.offlineSynced]);

  const cancelItem = useCallback(async (id: number) => {
    try {
      await removeById(id);
      await refreshCount();
    } catch { /* IndexedDB unavailable */ }
  }, [refreshCount]);

  const manualRetry = useCallback(async () => {
    if (!navigator.onLine) {
      toast.error(t.clock.offlineStillOffline);
      return;
    }
    await replayQueue();
  }, [replayQueue, t.clock.offlineStillOffline]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => { setIsOnline(true); replayQueue(); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    refreshCount();
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, [replayQueue, refreshCount]);

  return { isOnline, pendingCount, pendingItems, cancelItem, manualRetry };
}
