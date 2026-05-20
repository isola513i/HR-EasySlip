"use client";

import { useTransition, useState, useEffect } from "react";
import { ShieldOff, Clock, Lock } from "lucide-react";
import { endImpersonation } from "@/app/(tenant)/impersonation/end-action";

interface Props {
  platformEmail: string;
  expiresAt: number; // unix ms
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1_000);
  const min = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const sec = (totalSec % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

export function ImpersonationBanner({ platformEmail, expiresAt }: Props) {
  const [pending, startTransition] = useTransition();
  const [countdown, setCountdown] = useState(() => formatCountdown(expiresAt - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(formatCountdown(expiresAt - Date.now()));
    }, 1_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  function handleEnd() {
    startTransition(async () => {
      const result = await endImpersonation();
      if (result?.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    });
  }

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-red-600 text-white text-xs font-medium px-4 py-2 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <Lock className="size-3.5" />
          <span className="font-bold tracking-wide uppercase">READ-ONLY SUPPORT SESSION</span>
        </div>
        <span className="hidden sm:inline text-red-200">·</span>
        <span className="hidden sm:inline text-red-100 truncate font-mono">{platformEmail}</span>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-3">
        <div className="flex items-center gap-1 text-red-100">
          <Clock className="size-3" />
          <span className="font-mono tabular-nums">{countdown}</span>
        </div>
        <button
          onClick={handleEnd}
          disabled={pending}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/20 text-white text-xs font-semibold hover:bg-white/30 disabled:opacity-50 transition-colors border border-white/30"
        >
          <ShieldOff className="size-3" />
          {pending ? "Ending…" : "End Session"}
        </button>
      </div>
    </div>
  );
}
