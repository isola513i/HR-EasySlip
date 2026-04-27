"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

export function OnboardingWelcome() {
  const t = useT();
  return (
    <div className="rounded-xl border bg-card p-6 shadow-[var(--es-shadow-sm)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="es-brand-gradient grid size-10 place-items-center rounded-xl">
          <Sparkles className="size-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold">{t.onboarding.welcomeTitle}</h2>
          <p className="text-xs text-muted-foreground">{t.onboarding.welcomeSubtitle}</p>
        </div>
      </div>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>{t.onboarding.usedFor}</p>
        <ul className="ml-4 list-disc space-y-1">
          <li><strong>{t.onboarding.attendanceFeature}</strong> — {t.onboarding.attendanceDesc}</li>
          <li><strong>{t.onboarding.leaveFeature}</strong> — {t.onboarding.leaveDesc}</li>
          <li><strong>{t.onboarding.profileFeature}</strong> — {t.onboarding.profileDesc}</li>
        </ul>
        <p className="pt-2">
          {t.onboarding.completePrompt}
        </p>
      </div>
    </div>
  );
}
