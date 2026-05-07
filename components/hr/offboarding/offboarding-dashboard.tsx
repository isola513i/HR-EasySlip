"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OffboardingCard } from "@/components/hr/offboarding/offboarding-card";
import { OffboardingStartDialog } from "@/components/hr/offboarding/offboarding-start-dialog";
import { useOffboarding } from "@/hooks/use-offboarding";
import { useT } from "@/lib/i18n/locale-context";

export function OffboardingDashboard() {
  const t = useT();
  const { items, isLoading, error, complete } = useOffboarding();
  const [startOpen, setStartOpen] = useState(false);

  const handleComplete = async (id: string) => {
    try { await complete(id); toast.success(t.hr.offboarding.completeSuccess); }
    catch { toast.error(t.hr.offboarding.completeFailed); }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">{t.hr.offboarding.pageTitle}</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{t.hr.offboarding.pageSubtitle}</p>
        </div>
        <Button onClick={() => setStartOpen(true)} className="gap-1.5">
          <Plus className="size-4" /> {t.hr.offboarding.startBtn}
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)}
        </div>
      )}
      {!isLoading && error && (
        <div className="py-12 text-center text-sm text-destructive">{error}</div>
      )}
      {!isLoading && !error && items.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <UserMinus className="size-10 opacity-40" />
          <p className="text-sm">{t.hr.offboarding.empty}</p>
        </div>
      )}
      {!isLoading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {items.map((rec) => (
            <OffboardingCard key={rec.id} record={rec} onComplete={() => handleComplete(rec.id)} />
          ))}
        </div>
      )}

      <OffboardingStartDialog open={startOpen} onClose={() => setStartOpen(false)} />
    </div>
  );
}
