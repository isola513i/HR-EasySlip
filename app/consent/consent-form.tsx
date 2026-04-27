"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ApiClientError } from "@/lib/api/client";
import { useT } from "@/lib/i18n/locale-context";

export function ConsentForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const t = useT();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!agreed) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/consent/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const json = await res.json();
      if (!json.ok) throw new ApiClientError(json.code, json.error, res.status);
      router.push(callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.consent.saveFailed);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.consent.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t.consent.subtitle}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground">
        <p className="mb-3 font-medium text-foreground">{t.consent.dataCollected}</p>
        <ul className="list-inside list-disc space-y-1">
          <li>{t.consent.personalData}</li>
          <li>{t.consent.contactData}</li>
          <li>{t.consent.attendanceData}</li>
          <li>{t.consent.leaveData}</li>
        </ul>
        <p className="mt-3">
          {t.consent.legalBasis}
        </p>
        <Link href="/privacy" className="mt-2 inline-block text-xs underline underline-offset-4">
          {t.consent.readFull}
        </Link>
      </div>

      <label className="flex items-start gap-3">
        <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
        <span className="text-sm leading-relaxed">
          {t.consent.checkboxLabel}
        </span>
      </label>

      {error && (
        <p className="text-sm text-[var(--es-error-500)]">{error}</p>
      )}

      <Button className="w-full" size="lg" disabled={!agreed || loading} onClick={handleSubmit}>
        {loading ? t.consent.confirming : t.consent.confirmButton}
      </Button>
    </div>
  );
}
