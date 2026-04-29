"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale-context";

const HMR_AUTO_RELOAD_SECONDS = 2;

const isHmrStaleModuleError = (error: Error): boolean => {
  const msg = error.message ?? "";
  return (
    msg.includes("module factory is not available") ||
    msg.includes("deleted in an HMR update") ||
    msg.includes("Cannot find module") ||
    msg.includes("Failed to fetch dynamically imported module")
  );
};

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  const isHmr = isHmrStaleModuleError(error);
  const [secondsLeft, setSecondsLeft] = useState(HMR_AUTO_RELOAD_SECONDS);

  useEffect(() => {
    console.error("[ErrorBoundary]", error);
  }, [error]);

  useEffect(() => {
    if (!isHmr) return;
    if (secondsLeft <= 0) {
      window.location.reload();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [isHmr, secondsLeft]);

  const handleReload = () => window.location.reload();

  return (
    <main className="grid min-h-dvh place-items-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <p className="font-mono text-6xl font-bold text-muted-foreground">500</p>
          <h1 className="text-xl font-semibold tracking-tight">
            {isHmr ? t.errorPage.hmrTitle : t.errorPage.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isHmr
              ? t.errorPage.hmrMessage
              : (error.message || t.errorPage.fallbackMessage)}
          </p>
          {isHmr && secondsLeft > 0 && (
            <p className="pt-1 text-xs text-muted-foreground/80 tabular-nums">
              {t.errorPage.hmrAutoReload.replace("{seconds}", String(secondsLeft))}
            </p>
          )}
        </div>
        {isHmr ? (
          <Button className="w-full" onClick={handleReload}>
            {t.errorPage.reloadPage}
          </Button>
        ) : (
          <Button variant="outline" className="w-full" onClick={reset}>
            {t.errorPage.tryAgain}
          </Button>
        )}
      </div>
    </main>
  );
}
