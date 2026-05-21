"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  ExternalLink,
  Lock,
  MapPin,
  Phone,
  Scale,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ApiClientError } from "@/lib/api/client";
import { useT } from "@/lib/i18n/locale-context";

type DataItem = {
  icon: typeof User;
  label: string;
  desc: string;
};

export function ConsentForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const t = useT();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataItems: DataItem[] = [
    { icon: User, label: t.consent.personalData, desc: t.consent.personalDataDesc },
    { icon: Phone, label: t.consent.contactData, desc: t.consent.contactDataDesc },
    { icon: MapPin, label: t.consent.attendanceData, desc: t.consent.attendanceDataDesc },
    { icon: CalendarDays, label: t.consent.leaveData, desc: t.consent.leaveDataDesc },
  ];

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
    <div className="w-full max-w-xl space-y-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-11 items-center justify-center rounded-xl bg-(--es-accent-50) text-(--es-accent-600) ring-1 ring-(--es-accent-100)">
          <ShieldCheck className="size-5" aria-hidden />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight">{t.consent.title}</h1>
          <p className="text-sm text-muted-foreground">{t.consent.subtitle}</p>
        </div>
      </div>

      <section
        aria-labelledby="data-collected-heading"
        className="rounded-xl border border-border bg-card p-4 shadow-(--es-shadow-sm)"
      >
        <h2
          id="data-collected-heading"
          className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
        >
          {t.consent.dataCollected}
        </h2>

        <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="list">
          {dataItems.map(({ icon: Icon, label, desc }) => (
            <li key={label} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/70">
                <Icon className="size-3.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs leading-snug text-muted-foreground">{desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <Separator className="my-3" />

        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/70">
            <Scale className="size-3.5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {t.consent.legalBasisHeading}
            </p>
            <p className="text-xs leading-snug text-muted-foreground">
              {t.consent.legalBasis}
            </p>
          </div>
        </div>

        <Link
          href="/privacy"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-(--es-accent-600) underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {t.consent.readFull}
          <ExternalLink className="size-3" aria-hidden />
        </Link>
      </section>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-(--es-shadow-sm) transition-colors hover:bg-muted/40">
        <Checkbox
          checked={agreed}
          onCheckedChange={(v) => setAgreed(!!v)}
          className="mt-0.5"
          aria-describedby="consent-checkbox-text"
        />
        <span id="consent-checkbox-text" className="text-sm leading-relaxed">
          {t.consent.checkboxLabel}
        </span>
      </label>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-(--es-error-50) p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <Button
        className="w-full"
        disabled={!agreed || loading}
        onClick={handleSubmit}
      >
        <ShieldCheck className="size-4" aria-hidden />
        {loading ? t.consent.confirming : t.consent.confirmButton}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Lock className="size-3" aria-hidden />
        {t.consent.footerTrust}
      </p>
    </div>
  );
}
