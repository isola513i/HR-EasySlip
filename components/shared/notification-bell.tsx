"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiFetch } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/format";
import { getActionLabel } from "@/lib/audit/action-labels";

interface NotifItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiFetch<NotifItem[]>("/api/v1/audit/logs?perPage=8")
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="Notifications"
        className="relative grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 active:transition-transform active:duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Bell className="size-[18px]" strokeWidth={1.75} />
        <span className="pointer-events-none absolute right-1 top-1 grid place-items-center">
          <span aria-hidden="true" className="absolute inline-flex size-2.5 animate-ping rounded-full bg-[var(--es-error-500)] opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-[var(--es-error-500)]" />
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(90vw,340px)] p-0">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Notifications</div>
        <div className="max-h-[320px] overflow-y-auto">
          {loading && <div className="px-4 py-6 text-center text-xs text-muted-foreground">Loading...</div>}
          {!loading && items.length === 0 && <div className="px-4 py-6 text-center text-xs text-muted-foreground">No recent activity</div>}
          {items.map((n) => (
            <div key={n.id} className="border-b border-[var(--es-neutral-100)] px-4 py-2.5 last:border-b-0">
              <div className="text-[13px] font-medium">{getActionLabel(n.action, "en")}</div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{n.entityType} #{n.entityId.slice(-6)}</span>
                <span>{formatRelativeTime(n.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
