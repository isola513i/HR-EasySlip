"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

const DISMISS_KEY = "es:pwa-install-dismissed";
const DISMISS_TTL_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

function recentlyDismissed() {
  if (typeof localStorage === "undefined") return false;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!ts) return false;
  return Date.now() - ts < DISMISS_TTL_DAYS * 24 * 60 * 60 * 1000;
}

export function InstallPrompt() {
  const t = useT();
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    if (isIOS()) {
      setShowIos(true);
      setHidden(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setHidden(true);
  };

  const install = async () => {
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") {
      setHidden(true);
    } else {
      dismiss();
    }
  };

  if (hidden) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]">
      <div className="flex items-start gap-3">
        <div className="es-brand-gradient grid size-10 shrink-0 place-items-center rounded-xl text-white">
          <Download className="size-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{t.pwa.installTitle}</div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t.pwa.installSubtitle}
          </p>
          {showIos ? (
            <ol className="mt-2.5 space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Share className="size-3.5 shrink-0" /> {t.pwa.iosStep1}
              </li>
              <li className="pl-5">{t.pwa.iosStep2}</li>
            </ol>
          ) : (
            <button
              onClick={install}
              className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--es-accent-600)] px-3 text-xs font-semibold text-white transition-colors hover:bg-[var(--es-accent-700)]"
            >
              <Download className="size-3.5" /> {t.pwa.install}
            </button>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label={t.pwa.dismiss}
          className="-mr-1 -mt-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
