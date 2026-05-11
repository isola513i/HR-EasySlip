"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { MobileTopbar } from "@/components/shared/mobile-topbar";
import { SectionLabel } from "@/components/shared/section-label";
import { StatusPill } from "@/components/shared/status-pill";
import { apiFetch } from "@/lib/api/client";
import { useT } from "@/lib/i18n/locale-context";
import type { ReviewDetail } from "@/hooks/use-reviews";

interface Props { reviewId: string }

export function ReviewFormScreen({ reviewId }: Props) {
  const t = useT();
  const router = useRouter();
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [overall, setOverall] = useState<number | "">("");
  const [comments, setComments] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<ReviewDetail>(`/api/v1/reviews/${reviewId}`)
      .then((r) => {
        setReview(r);
        setAnswers((r.answers ?? {}) as Record<string, string | number>);
        setOverall(r.overallRating ?? "");
        setComments(r.comments ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "load failed"));
  }, [reviewId]);

  if (error) return <div className="py-12 text-center text-sm text-destructive">{error}</div>;
  if (!review) {
    return (
      <>
        <MobileTopbar title={t.reviews.formTitle} />
        <div className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      </>
    );
  }

  const questions = review.cycle.template?.questions ?? [];
  const isReadOnly = review.status !== "DRAFT";
  const isSelf = review.reviewType === "SELF";
  const subject = isSelf ? t.reviews.aboutYou : `${review.reviewee.firstNameTh} ${review.reviewee.lastNameTh}`;

  const setAnswer = (key: string, value: string | number) =>
    setAnswers((a) => ({ ...a, [key]: value }));

  const requiredOk = questions
    .filter((q) => q.required)
    .every((q) => {
      const v = answers[q.key];
      return v !== undefined && v !== null && (typeof v === "string" ? v.trim().length > 0 : true);
    });

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await apiFetch(`/api/v1/reviews/${reviewId}/draft`, {
        method: "PATCH",
        body: JSON.stringify({
          answers,
          overallRating: overall === "" ? null : overall,
          comments: comments.trim() || null,
        }),
      });
      toast.success(t.reviews.draftSaved);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.reviews.draftFailed);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!requiredOk) { toast.error(t.reviews.fillRequired); return; }
    setSubmitting(true);
    try {
      await apiFetch(`/api/v1/reviews/${reviewId}/submit`, {
        method: "POST",
        body: JSON.stringify({
          answers,
          overallRating: overall === "" ? undefined : overall,
          comments: comments.trim() || undefined,
        }),
      });
      toast.success(t.reviews.submitted);
      router.push("/employee/reviews");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.reviews.submitFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <MobileTopbar title={review.cycle.name} />
      <div className="flex flex-col gap-5 p-4">
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-(--es-shadow-sm)">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{t.reviews.subject}</span>
            <StatusPill tone={isReadOnly ? "neutral" : "info"}>{t.reviews.statuses[review.status]}</StatusPill>
          </div>
          <div className="mt-1 text-sm font-semibold">{subject}</div>
        </div>

        {questions.map((q) => (
          <div key={q.key}>
            <SectionLabel htmlFor={`q-${q.key}`}>
              {q.label}{q.required ? " *" : ""}
            </SectionLabel>
            {q.type === "scale" ? (
              <ScaleInput
                value={typeof answers[q.key] === "number" ? (answers[q.key] as number) : 0}
                onChange={(v) => setAnswer(q.key, v)}
                disabled={isReadOnly}
              />
            ) : (
              <Textarea
                id={`q-${q.key}`}
                value={String(answers[q.key] ?? "")}
                onChange={(e) => setAnswer(q.key, e.target.value)}
                rows={3}
                disabled={isReadOnly}
                className="bg-(--es-neutral-50)"
              />
            )}
          </div>
        ))}

        <div>
          <SectionLabel htmlFor="overall">{t.reviews.overallRating}</SectionLabel>
          <ScaleInput
            value={typeof overall === "number" ? overall : 0}
            onChange={setOverall}
            disabled={isReadOnly}
          />
        </div>

        <div>
          <SectionLabel htmlFor="comments">{t.reviews.comments}</SectionLabel>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
            disabled={isReadOnly}
            className="bg-(--es-neutral-50)"
          />
        </div>

        {!isReadOnly && (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-full" disabled={savingDraft} onClick={handleSaveDraft}>
              {savingDraft ? t.common.saving : t.reviews.saveDraft}
            </Button>
            <Button className="flex-1 rounded-full" size="lg" disabled={submitting || !requiredOk} onClick={handleSubmit}>
              {submitting ? t.common.saving : t.reviews.submit}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function ScaleInput({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={`grid size-10 place-items-center rounded-lg border text-sm font-semibold tabular-nums transition-colors ${
            value === n
              ? "border-(--es-accent-600) bg-(--es-accent-50) text-(--es-accent-700)"
              : "border-border bg-card text-muted-foreground hover:bg-muted disabled:opacity-50"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
