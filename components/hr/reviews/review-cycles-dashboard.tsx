"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Play, Lock as LockIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/shared/status-pill";
import { ScrollableTable } from "@/components/shared/scrollable-table";
import { ReviewCycleCreateDialog } from "@/components/hr/reviews/review-cycle-create-dialog";
import { ReviewTemplateCreateDialog } from "@/components/hr/reviews/review-template-create-dialog";
import { useReviewCycles, type ReviewCycleStatus } from "@/hooks/use-reviews";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";

const GRID = "grid-cols-[1.5fr_120px_180px_120px_100px_180px]";

const STATUS_TONE: Record<ReviewCycleStatus, "info" | "success" | "neutral"> = {
  DRAFT: "info",
  ACTIVE: "success",
  CLOSED: "neutral",
};

export function ReviewCyclesDashboard() {
  const t = useT();
  const fmt = useFormat();
  const { items, templates, isLoading, error, activate, close } = useReviewCycles();
  const [createCycleOpen, setCreateCycleOpen] = useState(false);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);

  const handleActivate = async (id: string) => {
    try { await activate(id); toast.success(t.hr.reviews.activateSuccess); }
    catch { toast.error(t.hr.reviews.activateFailed); }
  };
  const handleClose = async (id: string) => {
    try { await close(id); toast.success(t.hr.reviews.closeSuccess); }
    catch { toast.error(t.hr.reviews.closeFailed); }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">{t.hr.reviews.pageTitle}</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{t.hr.reviews.pageSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setCreateTemplateOpen(true)} className="gap-1.5">
            <FileText className="size-4" /> {t.hr.reviews.newTemplate}
          </Button>
          <Button onClick={() => setCreateCycleOpen(true)} disabled={templates.length === 0} className="gap-1.5">
            <Plus className="size-4" /> {t.hr.reviews.newCycle}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-(--es-shadow-sm)">
        {isLoading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        )}
        {!isLoading && error && (
          <div className="px-4 py-12 text-center text-sm text-destructive">{error}</div>
        )}
        {!isLoading && !error && items.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-muted-foreground">
            <FileText className="size-10 opacity-40" />
            <p className="text-sm">{t.hr.reviews.empty}</p>
          </div>
        )}
        {!isLoading && !error && items.length > 0 && (
          <ScrollableTable minWidth={920}>
            <div className={`grid ${GRID} border-b border-border bg-(--es-neutral-50) px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground`}>
              <span>{t.hr.reviews.colName}</span>
              <span>{t.hr.reviews.colCadence}</span>
              <span>{t.hr.reviews.colDates}</span>
              <span>{t.hr.reviews.colTemplate}</span>
              <span>{t.hr.reviews.colReviews}</span>
              <span className="text-right">{t.hr.reviews.colActions}</span>
            </div>
            {items.map((c) => (
              <div key={c.id} className={`grid ${GRID} items-center border-b border-(--es-neutral-100) px-5 py-3.5 text-[13px] last:border-b-0`}>
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <StatusPill tone={STATUS_TONE[c.status]}>{c.status}</StatusPill>
                </div>
                <span className="text-muted-foreground">{t.hr.reviews.cadences[c.cadence]}</span>
                <span className="tabular-nums text-muted-foreground">
                  {fmt.formatShortDate(c.startDate)} – {fmt.formatShortDate(c.endDate)}
                </span>
                <span className="truncate text-muted-foreground">{c.template?.name ?? "—"}</span>
                <span className="tabular-nums">{c._count.reviews}</span>
                <div className="flex justify-end gap-1.5">
                  {c.status === "DRAFT" && (
                    <Button size="sm" variant="outline" onClick={() => handleActivate(c.id)}>
                      <Play className="mr-1 size-3.5" /> {t.hr.reviews.activate}
                    </Button>
                  )}
                  {c.status === "ACTIVE" && (
                    <Button size="sm" variant="outline" onClick={() => handleClose(c.id)}>
                      <LockIcon className="mr-1 size-3.5" /> {t.hr.reviews.close}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </ScrollableTable>
        )}
      </div>

      <ReviewCycleCreateDialog
        open={createCycleOpen}
        templates={templates}
        onClose={() => setCreateCycleOpen(false)}
      />
      <ReviewTemplateCreateDialog
        open={createTemplateOpen}
        onClose={() => setCreateTemplateOpen(false)}
      />
    </div>
  );
}
