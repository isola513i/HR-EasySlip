"use client";

import { useState } from "react";
import { dismissTempPassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Check, Copy, KeyRound, X } from "lucide-react";

interface Props {
  email: string;
  password: string;
}

export function TempPasswordBanner({ email, password }: Props) {
  const [copied, setCopied] = useState<"email" | "password" | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const copy = async (value: string, which: "email" | "password") => {
    await navigator.clipboard.writeText(value);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  };

  if (dismissed) return null;

  return (
    <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-emerald-300">
          <KeyRound className="size-4 shrink-0" />
          <span className="text-sm font-medium">Tenant provisioned — admin credentials</span>
        </div>
        <form
          action={async () => {
            await dismissTempPassword();
            setDismissed(true);
          }}
        >
          <button
            type="submit"
            className="text-emerald-400/60 hover:text-emerald-300 transition-colors"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </form>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Share these one-time credentials with the new admin. They will be required to change the password on first sign-in. This banner will not appear again after dismissal.
      </p>
      <div className="grid sm:grid-cols-2 gap-2.5">
        <CredentialRow label="Email" value={email} onCopy={() => copy(email, "email")} copied={copied === "email"} />
        <CredentialRow label="Temp password" value={password} onCopy={() => copy(password, "password")} copied={copied === "password"} mono />
      </div>
    </div>
  );
}

function CredentialRow({
  label,
  value,
  onCopy,
  copied,
  mono,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/20 bg-background/40 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`text-sm text-foreground truncate ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onCopy}
        className="shrink-0 h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  );
}
