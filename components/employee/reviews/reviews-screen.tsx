"use client";

import Link from "next/link";
import { ChevronRight, ClipboardCheck, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/shared/status-pill";
import { MobileTopbar } from "@/components/shared/mobile-topbar";
import { useMyReviews, type ReviewStatus, type ReviewType } from "@/hooks/use-reviews";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";

const STATUS_TONE: Record<ReviewStatus, "info" | "success" | "neutral"> = {
  DRAFT: "info",
  SUBMITTED: "success",
  ACKNOWLEDGED: "neutral",
};

const TYPE_KEY: Record<ReviewType, "self" | "manager" | "peer"> = {
  SELF: "self",
  MANAGER: "manager",
  PEER: "peer",
};

export function ReviewsScreen() {
  const t = useT();
  const fmt = useFormat();
  const { items, isLoading, error } = useMyReviews();

  return (
    <>
      <MobileTopbar title={t.reviews.title} />
      <div className="flex flex-col gap-4 p-4">
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        )}
        {!isLoading && error && (
          <div className="py-12 text-center text-sm text-destructive">{error}</div>
        )}
        {!isLoading && !error && items.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <ClipboardCheck className="size-10 opacity-40" />
            <p className="text-sm">{t.reviews.empty}</p>
          </div>
        )}
        {!isLoading && !error && items.length > 0 && items.map((r) => {
          const isSelf = r.reviewType === "SELF";
          const subjectName = isSelf
            ? t.reviews.aboutYou
            : `${r.reviewee.firstNameTh} ${r.reviewee.lastNameTh}`;
          return (
            <Link
              key={r.id}
              href={`/employee/reviews/${r.id}`}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 shadow-(--es-shadow-sm) transition-colors hover:bg-muted/40"
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--es-accent-50) text-(--es-accent-600)">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold">{r.cycle.name}</span>
                  <StatusPill tone={STATUS_TONE[r.status]}>{t.reviews.statuses[r.status]}</StatusPill>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{t.reviews.types[TYPE_KEY[r.reviewType]]}</span>
                  <span>·</span>
                  <span className="text-foreground">{subjectName}</span>
                </div>
                <div className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                  {t.reviews.dueBy}: {fmt.formatShortDate(r.cycle.endDate)}
                </div>
              </div>
              <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </>
  );
}
