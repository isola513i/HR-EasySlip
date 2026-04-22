"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface MobileTopbarProps {
  title: string;
  backHref?: string;
}

export function MobileTopbar({ title, backHref }: MobileTopbarProps) {
  const router = useRouter();

  return (
    <header className="flex h-14 items-center gap-3 border-b border-[var(--es-neutral-100)] px-4">
      {backHref && (
        <button
          onClick={() => router.push(backHref)}
          className="rounded-lg p-2 text-foreground transition-colors hover:bg-muted"
          aria-label="Go back"
        >
          <ChevronLeft className="size-[22px]" />
        </button>
      )}
      <span className="text-base font-semibold">{title}</span>
    </header>
  );
}
