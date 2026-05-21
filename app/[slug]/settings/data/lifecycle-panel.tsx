"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Download, ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TenantLifecycleStatus } from "./actions";

interface Props {
  lifecycle: TenantLifecycleStatus;
  exportUrl: string;
  t: {
    accountActive: string;
    accountExpired: string;
    accountSuspended: string;
    gracePeriodEnds: string;
    softDeleteScheduled: string;
    hardDeleteScheduled: string;
    softDeleteDone: string;
    exportBtn: string;
    exportHint: string;
    contactRenewal: string;
    daysLeft: string;
  };
}

function useDaysLeft(iso: string | null): number | null {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    if (!iso) return;
    const diff = new Date(iso).getTime() - Date.now();
    setDays(Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1_000))));
  }, [iso]);
  return days;
}

export function LifecyclePanel({ lifecycle, exportUrl, t }: Props) {
  const graceDays = useDaysLeft(lifecycle.gracePeriodEndsAt);
  const hardDays = useDaysLeft(lifecycle.hardDeleteAt);

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : "—";

  const isExpired = lifecycle.status === "EXPIRED";
  const isSuspended = lifecycle.status === "SUSPENDED";
  const isActive = lifecycle.status === "ACTIVE" || lifecycle.status === "TRIAL";

  return (
    <div className="space-y-4">
      {/* Status card */}
      <div className={cn(
        "flex items-start gap-3 rounded-xl border p-5",
        isActive && "border-emerald-500/20 bg-emerald-500/5",
        isExpired && "border-amber-500/20 bg-amber-500/5",
        isSuspended && "border-rose-500/20 bg-rose-500/5",
      )}>
        {isActive && <CheckCircle2 className="size-5 text-emerald-400 mt-0.5 shrink-0" />}
        {isExpired && <Clock className="size-5 text-amber-400 mt-0.5 shrink-0" />}
        {isSuspended && <ShieldAlert className="size-5 text-rose-400 mt-0.5 shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-semibold",
            isActive && "text-emerald-400",
            isExpired && "text-amber-400",
            isSuspended && "text-rose-400",
          )}>
            {isActive && t.accountActive}
            {isExpired && t.accountExpired}
            {isSuspended && t.accountSuspended}
          </p>

          {isExpired && lifecycle.gracePeriodEndsAt && (
            <p className="text-xs text-muted-foreground mt-1">
              {t.gracePeriodEnds}: <span className="text-foreground font-medium">{fmt(lifecycle.gracePeriodEndsAt)}</span>
              {graceDays !== null && (
                <span className="ml-1 text-amber-400">({graceDays} {t.daysLeft})</span>
              )}
            </p>
          )}
          {(isExpired || isSuspended) && !lifecycle.softDeletedAt && lifecycle.softDeleteAt && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.softDeleteScheduled}: <span className="text-foreground font-medium">{fmt(lifecycle.softDeleteAt)}</span>
            </p>
          )}
          {lifecycle.softDeletedAt && (
            <p className="text-xs text-rose-400 mt-0.5">{t.softDeleteDone}</p>
          )}
          {(isExpired || isSuspended) && lifecycle.hardDeleteAt && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.hardDeleteScheduled}: <span className="text-foreground font-medium">{fmt(lifecycle.hardDeleteAt)}</span>
              {hardDays !== null && (
                <span className="ml-1 text-rose-400">({hardDays} {t.daysLeft})</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Renewal prompt */}
      {(isExpired || isSuspended) && (
        <div className="flex items-start gap-3 rounded-xl border border-border p-4 bg-card">
          <AlertTriangle className="size-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">{t.contactRenewal}</p>
        </div>
      )}

      {/* Export */}
      <div className="rounded-xl border border-border p-5 space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Download className="size-4" /> {t.exportBtn}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{t.exportHint}</p>
        </div>
        <a
          href={lifecycle.softDeletedAt ? undefined : exportUrl}
          download={!lifecycle.softDeletedAt}
          aria-disabled={!!lifecycle.softDeletedAt}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Download className="size-3.5 mr-1.5" />
          {t.exportBtn}
        </a>
      </div>
    </div>
  );
}
