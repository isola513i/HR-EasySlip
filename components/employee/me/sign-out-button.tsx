"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useT } from "@/lib/i18n/locale-context";

export function SignOutButton() {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/signin" })}
      className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--es-error-200)] bg-[var(--es-error-50)] px-4 py-3.5 text-sm font-semibold text-[var(--es-error-600)] transition-colors hover:bg-[var(--es-error-100)]"
    >
      <LogOut className="size-4" strokeWidth={2} />
      {t.common.signOut}
    </button>
  );
}
