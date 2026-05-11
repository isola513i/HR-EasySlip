"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardCheck, X } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  remaining: number;
}

export function OnboardingBanner({ remaining }: Props) {
  const t = useT();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || remaining <= 0) return null;

  return (
    <div className="flex items-center gap-3 border-b border-(--es-accent-200) bg-(--es-accent-50) px-4 py-2.5">
      <ClipboardCheck className="size-4 shrink-0 text-(--es-accent-600)" />
      <p className="flex-1 text-xs text-(--es-accent-700)">
        {t.onboarding.bannerMessage.replace("{count}", String(remaining))}
      </p>
      <Link
        href="/employee/onboarding"
        className="shrink-0 rounded-md bg-(--es-accent-600) px-3 py-1 text-xs font-medium text-white hover:bg-(--es-accent-700) transition-colors"
      >
        {t.onboarding.bannerAction}
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t.common.dismiss}
        className="shrink-0 rounded-md p-0.5 text-(--es-accent-400) hover:text-(--es-accent-700)"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
