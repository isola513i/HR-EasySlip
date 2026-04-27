"use client";

import { X, RefreshCw, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale-context";
import type { PendingRequest } from "@/lib/offline/offline-queue";

const PATH_LABELS: Record<string, string> = {
  "/api/v1/attendance/clock": "clock",
  "/api/v1/leave/requests": "leave",
  "/api/v1/attendance/adjustment": "adjustment",
  "/api/v1/overtime/requests": "ot",
};

function getLabel(url: string, t: ReturnType<typeof useT>): string {
  for (const [path, key] of Object.entries(PATH_LABELS)) {
    if (url.includes(path)) {
      const labels: Record<string, string> = {
        clock: t.clock.title, leave: t.leave.title,
        adjustment: t.employee.timesheet, ot: t.ot.title,
      };
      return labels[key] ?? key;
    }
  }
  return "Request";
}

interface Props {
  open: boolean;
  onClose: () => void;
  items: PendingRequest[];
  isOnline: boolean;
  onCancel: (id: number) => void;
  onRetry: () => void;
}

export function OfflineQueuePanel({ open, onClose, items, isOnline, onCancel, onRetry }: Props) {
  const t = useT();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-2xl bg-card p-5 shadow-lg sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t.offline.queuedItems}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t.offline.noQueuedItems}</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{getLabel(item.url, t)}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <button
                  onClick={() => item.id && onCancel(item.id)}
                  className="rounded-md p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <Button
            onClick={onRetry}
            disabled={!isOnline}
            className="mt-4 w-full"
            variant="outline"
          >
            <RefreshCw className="mr-1.5 size-3.5" /> {t.offline.retryAll}
          </Button>
        )}
      </div>
    </div>
  );
}
