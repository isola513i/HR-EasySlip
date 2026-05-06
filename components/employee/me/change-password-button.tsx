"use client";

import { KeyRound } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

interface ChangePasswordButtonProps {
  onClick: () => void;
}

export function ChangePasswordButton({ onClick }: ChangePasswordButtonProps) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40"
    >
      <KeyRound className="size-4" strokeWidth={2} />
      {t.password.changeButton}
    </button>
  );
}
