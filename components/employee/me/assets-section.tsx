"use client";

import { useEffect, useState } from "react";
import { Boxes, Laptop, Smartphone, Monitor, Headphones, Tablet, Package } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";

interface AssignmentItem {
  id: string;
  assignedAt: string;
  asset: {
    id: string;
    type: "LAPTOP" | "PHONE" | "MONITOR" | "HEADSET" | "TABLET" | "OTHER";
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    status: string;
  };
}

const ICON_BY_TYPE = {
  LAPTOP: Laptop,
  PHONE: Smartphone,
  MONITOR: Monitor,
  HEADSET: Headphones,
  TABLET: Tablet,
  OTHER: Package,
} as const;

export function AssetsSection() {
  const t = useT();
  const { formatDate } = useFormat();
  const [items, setItems] = useState<AssignmentItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AssignmentItem[]>("/api/v1/employee/me/assets")
      .then(setItems)
      .catch(() => { setError(t.common.loadFailed); setItems([]); });
  }, [t.common.loadFailed]);

  if (items === null) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
      </div>
    );
  }

  if (error) return <div className="px-2 py-4 text-center text-sm text-destructive">{error}</div>;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-2 py-8 text-muted-foreground">
        <Boxes className="size-8 opacity-40" />
        <p className="text-xs">{t.profile.assets.empty}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2 p-1">
      {items.map((a) => {
        const Icon = ICON_BY_TYPE[a.asset.type] ?? Package;
        const label = [a.asset.brand, a.asset.model].filter(Boolean).join(" ") || t.profile.assets.untitled;
        return (
          <li key={a.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-(--es-shadow-xs)">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--es-accent-50) text-(--es-accent-600)">
              <Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{label}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>{t.profile.assets.types[a.asset.type]}</span>
                {a.asset.serialNumber && (<>
                  <span>·</span>
                  <span className="font-mono">{a.asset.serialNumber}</span>
                </>)}
              </div>
              <div className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                {t.profile.assets.assignedAt}: {formatDate(a.assignedAt)}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
