"use client";

import { UserPlus, Undo2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/shared/status-pill";
import { useT } from "@/lib/i18n/locale-context";
import type { AssetRow, AssetStatus } from "@/hooks/use-assets";

const STATUS_TONE: Record<AssetStatus, "success" | "info" | "warn" | "neutral"> = {
  AVAILABLE: "success",
  ASSIGNED: "info",
  REPAIR: "warn",
  RETIRED: "neutral",
};

export function assetLabel(a: AssetRow): string {
  return [a.brand, a.model].filter(Boolean).join(" ") || a.serialNumber || a.id.slice(-6);
}

export { STATUS_TONE };

interface ActionProps {
  asset: AssetRow;
  onAssign: () => void;
  onReturn: () => void;
  onRetire: () => void;
}

export function AssetActionButtons({ asset, onAssign, onReturn, onRetire }: ActionProps) {
  const t = useT();
  return (
    <>
      {asset.status === "AVAILABLE" && (
        <Button size="sm" variant="outline" onClick={onAssign}>
          <UserPlus className="mr-1 size-3.5" /> {t.hr.assets.assignBtn}
        </Button>
      )}
      {asset.status === "ASSIGNED" && (
        <Button size="sm" variant="outline" onClick={onReturn}>
          <Undo2 className="mr-1 size-3.5" /> {t.hr.assets.returnBtn}
        </Button>
      )}
      {asset.status !== "RETIRED" && (
        <Button size="sm" variant="outline" onClick={onRetire}>
          <Archive className="mr-1 size-3.5" /> {t.hr.assets.retireBtn}
        </Button>
      )}
    </>
  );
}

export function AssetCardMobile({ asset: a, onAssign, onReturn, onRetire }: ActionProps) {
  const t = useT();
  const assignee = a.assignments[0]?.employee;
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 shadow-[var(--es-shadow-sm)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{assetLabel(a)}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>{t.hr.assets.types[a.type]}</span>
            {a.serialNumber && <><span>·</span><span className="font-mono">{a.serialNumber}</span></>}
          </div>
        </div>
        <StatusPill tone={STATUS_TONE[a.status]}>{t.hr.assets.statuses[a.status]}</StatusPill>
      </div>
      {assignee && (
        <div className="mt-2 text-[12px] text-muted-foreground">
          {t.hr.assets.assignedTo}: <span className="text-foreground">{assignee.firstNameTh} {assignee.lastNameTh}</span>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <AssetActionButtons asset={a} onAssign={onAssign} onReturn={onReturn} onRetire={onRetire} />
      </div>
    </div>
  );
}
