"use client";

import { useEffect, useState } from "react";
import { apiFetchPaginated } from "@/lib/api/client";

const READ_KEY = "es-employee-inbox-last-read-at";

interface ActivityHead {
  createdAt: string;
}

function readLastReadAt(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(READ_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function markEmployeeInboxRead() {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(READ_KEY, String(Date.now())); } catch {}
  window.dispatchEvent(new Event("es-inbox-read"));
}

export function useEmployeeInboxUnread() {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const { data } = await apiFetchPaginated<ActivityHead>(
          "/api/v1/employee/me/activity?perPage=1",
        );
        if (cancelled) return;
        const newest = data[0];
        if (!newest) { setHasUnread(false); return; }
        const newestTs = new Date(newest.createdAt).getTime();
        setHasUnread(newestTs > readLastReadAt());
      } catch {
        if (!cancelled) setHasUnread(false);
      }
    };
    refresh();
    const onRead = () => setHasUnread(false);
    window.addEventListener("es-inbox-read", onRead);
    return () => { cancelled = true; window.removeEventListener("es-inbox-read", onRead); };
  }, []);

  return hasUnread;
}
