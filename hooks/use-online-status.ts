"use client";

import { useState, useEffect, useCallback } from "react";
import { dequeueAll, getAllPending, removeById, type PendingRequest } from "@/lib/offline/offline-queue";
import { toast } from "sonner";

export function useOnlineStatus() {
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
      if (synced > 0) toast.success(`${synced} queued request(s) synced`);
      await refreshCount();
    } catch { /* IndexedDB unavailable */ }
  }, [refreshCount]);

  const cancelItem = useCallback(async (id: number) => {
    try {
      await removeById(id);
      await refreshCount();
    } catch { /* IndexedDB unavailable */ }
  }, [refreshCount]);

  const manualRetry = useCallback(async () => {
    if (!navigator.onLine) {
      toast.error("Still offline");
      return;
    }
    await replayQueue();
  }, [replayQueue]);

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
