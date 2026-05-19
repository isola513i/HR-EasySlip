"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useT } from "@/lib/i18n/locale-context";

export function SignOutButton() {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: `${window.location.origin}/signin` })}
      className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-(--es-error-200) bg-(--es-error-50) px-4 py-3.5 text-sm font-semibold text-(--es-error-600) transition-colors hover:bg-(--es-error-100)"
    >
      <LogOut className="size-4" strokeWidth={2} />
      {t.common.signOut}
    </button>
  );
}
