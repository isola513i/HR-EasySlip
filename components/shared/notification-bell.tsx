"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiFetch } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/format";
import { getActionLabel } from "@/lib/audit/action-labels";
import { useT } from "@/lib/i18n/locale-context";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

interface NotifItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

const READ_KEY_PREFIX = "es-notif-last-read-at";

function readKeyFor(userId: string) {
  return `${READ_KEY_PREFIX}:${userId}`;
}

function readLastReadAt(userId: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(readKeyFor(userId));
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const t = useT();
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastReadAt, setLastReadAt] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLastReadAt(readLastReadAt(userId));
    setHydrated(true);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    apiFetch<NotifItem[]>("/api/v1/audit/logs?perPage=8")
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open]);

  const unreadIds = useMemo(() => {
    if (!hydrated) return new Set<string>();
    return new Set(items.filter((n) => new Date(n.createdAt).getTime() > lastReadAt).map((n) => n.id));
  }, [items, lastReadAt, hydrated]);

  const unreadCount = unreadIds.size;

  const persistLastReadAt = (ts: number) => {
    setLastReadAt(ts);
    try {
      window.localStorage.setItem(readKeyFor(userId), String(ts));
    } catch {
      // ignore
    }
  };

  const handleMarkOne = (item: NotifItem) => {
    const ts = new Date(item.createdAt).getTime();
    if (ts > lastReadAt) persistLastReadAt(ts);
  };

  const handleMarkAll = () => {
    if (items.length === 0) return;
    const newest = Math.max(...items.map((n) => new Date(n.createdAt).getTime()));
    persistLastReadAt(Math.max(newest, Date.now()));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t.common.notifications}
        className="relative grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 active:transition-transform active:duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Bell className="size-[18px]" strokeWidth={1.75} />
        {hydrated && unreadCount > 0 && (
          <span className="pointer-events-none absolute right-1 top-1 grid place-items-center">
            <span aria-hidden="true" className="absolute inline-flex size-2.5 animate-ping rounded-full bg-[var(--es-error-500)] opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-[var(--es-error-500)]" />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(90vw,360px)] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="text-sm font-semibold">{t.common.notifications}</div>
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={unreadCount === 0}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
              unreadCount === 0
                ? "cursor-not-allowed text-muted-foreground/50"
                : "text-[var(--es-accent-600)] hover:bg-[var(--es-accent-50)]",
            )}
          >
            {t.common.markAllAsRead}
          </button>
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {loading && <div className="px-4 py-6 text-center text-xs text-muted-foreground">{t.common.loadingNotifications}</div>}
          {!loading && items.length === 0 && <div className="px-4 py-6 text-center text-xs text-muted-foreground">{t.common.noNotifications}</div>}
          {items.map((n) => {
            const isUnread = unreadIds.has(n.id);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleMarkOne(n)}
                className={cn(
                  "group flex w-full items-start gap-2.5 border-b border-[var(--es-neutral-100)] px-4 py-2.5 text-left transition-colors last:border-b-0",
                  isUnread ? "bg-[var(--es-accent-50)]/40 hover:bg-[var(--es-accent-50)]" : "hover:bg-muted/60",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    isUnread ? "bg-[var(--es-accent-500)]" : "bg-transparent",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className={cn("text-[13px] leading-tight", isUnread ? "font-semibold" : "font-medium")}>
                    {getActionLabel(n.action, locale)}
                  </div>
                  <div className="mt-0.5 flex justify-between gap-2 text-[11px] text-muted-foreground">
                    <span className="truncate">{n.entityType} #{n.entityId.slice(-6)}</span>
                    <span className="shrink-0 tabular-nums">{formatRelativeTime(n.createdAt)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
