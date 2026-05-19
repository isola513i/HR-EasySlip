"use client";

import { useTransition } from "react";
import { endImpersonation } from "@/app/(tenant)/impersonation/end-action";

interface Props {
  platformEmail: string;
  expiresAt: number; // unix ms
}

export function ImpersonationBanner({ platformEmail, expiresAt }: Props) {
  const [pending, startTransition] = useTransition();

  const expiryTime = new Date(expiresAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  function handleEnd() {
    startTransition(async () => {
      await endImpersonation();
    });
  }

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-yellow-400 text-yellow-950 text-sm font-medium px-4 py-2 flex items-center justify-between shadow-md">
      <span>
        👁 Viewed by SuperAdmin (<span className="font-mono">{platformEmail}</span>).
        Session expires at {expiryTime}.
      </span>
      <button
        onClick={handleEnd}
        disabled={pending}
        className="ml-4 px-3 py-0.5 rounded bg-yellow-700 text-white text-xs font-semibold hover:bg-yellow-800 disabled:opacity-50 transition-colors"
      >
        {pending ? "Ending…" : "End Session"}
      </button>
    </div>
  );
}
