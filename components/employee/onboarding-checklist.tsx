"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnboarding } from "@/hooks/use-onboarding";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";

const categoryLinks: Record<string, string> = {
  personal: "/employee/me",
  address: "/employee/me",
  profile_picture: "/employee/me",
  emergency: "/employee/me",
  documents: "/employee/me",
};

export function OnboardingChecklist() {
  const t = useT();
  const router = useRouter();
  const { checklist, isLoading, toggleItem } = useOnboarding();

  // Auto-redirect on completion. The flag prevents the redirect from re-firing
  // if the user comes back and toggles items off/on after completing once.
  const redirectedRef = useRef(false);
  useEffect(() => {
    if (redirectedRef.current) return;
    if (!checklist || checklist.progress.total === 0) return;
    if (checklist.progress.done < checklist.progress.total) return;
    redirectedRef.current = true;
    toast.success(t.onboarding.completedToast);
    setTimeout(() => router.push("/employee/today"), 1500);
  }, [checklist, router, t.onboarding.completedToast]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-3 w-full rounded-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!checklist) {
    return (
      <button
        type="button"
        disabled
        aria-disabled
        className="w-full rounded-xl bg-[var(--es-accent-600)] px-6 py-4 text-base font-semibold text-white opacity-90 shadow-[var(--es-shadow-md)] disabled:cursor-not-allowed"
      >
        {t.onboarding.noChecklist}
      </button>
    );
  }

  const { items, progress } = checklist;

  return (
    <div className="space-y-4">
<div className="rounded-xl border bg-card p-4 shadow-[var(--es-shadow-sm)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">{t.onboarding.progress}</span>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {progress.done}/{progress.total} ({progress.percent}%)
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-muted">
          <div
            className="h-2.5 rounded-full bg-[var(--es-accent-600)] transition-all duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

<div className="space-y-2">
        {items.map((item) => {
          const link = item.category ? categoryLinks[item.category] : undefined;
          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id, !item.isDone)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/50 shadow-[var(--es-shadow-sm)]",
                item.isDone && "bg-[var(--es-accent-50)]/50 border-[var(--es-accent-200)]",
              )}
            >
              {item.isDone ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--es-accent-600)]" />
              ) : (
                <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              )}
              <div className="flex-1 min-w-0">
                <div className={cn("text-sm font-medium", item.isDone && "line-through text-muted-foreground")}>
                  {item.title}
                </div>
                {item.description && (
                  <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                )}
              </div>
              {link && !item.isDone && (
                <Link
                  href={link}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-[var(--es-accent-600)]"
                >
                  <ExternalLink className="size-4" />
                </Link>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
