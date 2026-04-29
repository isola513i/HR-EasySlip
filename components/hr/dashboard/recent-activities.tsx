"use client";

import { useEffect, useState } from "react";
import { UserPlus, Calendar, DollarSign, FileText, Briefcase, Activity, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/format";
import { getActionLabel } from "@/lib/audit/action-labels";
import { useT } from "@/lib/i18n/locale-context";
import { useLocale } from "@/hooks/use-locale";

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

const ACTION_ICON: Record<string, { icon: LucideIcon; tone: string }> = {
  employee: { icon: UserPlus, tone: "bg-[var(--es-accent-50)] text-[var(--es-accent-600)]" },
  leave: { icon: Calendar, tone: "bg-[var(--es-info-50)] text-[var(--es-info-500)]" },
  payroll: { icon: DollarSign, tone: "bg-[var(--es-success-50)] text-[var(--es-success-600)]" },
  attendance: { icon: Activity, tone: "bg-[var(--es-warn-50)] text-[var(--es-warn-600)]" },
  overtime: { icon: Briefcase, tone: "bg-[var(--es-warn-50)] text-[var(--es-warn-600)]" },
  export: { icon: FileText, tone: "bg-muted text-muted-foreground" },
};

function iconFor(action: string) {
  const prefix = action.split(".")[0];
  return ACTION_ICON[prefix] ?? { icon: Activity, tone: "bg-muted text-muted-foreground" };
}

export function RecentActivities() {
  const t = useT();
  const { locale } = useLocale();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<ActivityItem[]>("/api/v1/audit/logs?perPage=6")
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
      <div className="border-b border-border px-5 py-4 text-base font-semibold">
        {t.hr.dashboard.recentActivities}
      </div>
      <div className="flex flex-col">
        {isLoading && (
          <div className="space-y-2 p-5">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">{t.hr.dashboard.noActivities}</div>
        )}
        {!isLoading && items.map((item, idx) => {
          const { icon: Icon, tone } = iconFor(item.action);
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-5 py-3.5 ${idx < items.length - 1 ? "border-b border-[var(--es-neutral-100)]" : ""}`}
            >
              <div className={`grid size-9 shrink-0 place-items-center rounded-full ${tone}`}>
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{getActionLabel(item.action, locale)}</div>
                <div className="text-[11px] text-muted-foreground">
                  {item.entityType} · {formatRelativeTime(item.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
