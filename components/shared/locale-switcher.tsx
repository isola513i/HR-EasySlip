"use client";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/use-locale";

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  const next = locale === "th" ? "en" : "th";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(next)}
      className="font-mono text-xs"
    >
      {locale === "th" ? "EN" : "TH"}
    </Button>
  );
}
