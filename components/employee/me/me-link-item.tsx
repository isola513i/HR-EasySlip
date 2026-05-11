"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeLinkItemProps {
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function MeLinkItem({ label, href, onClick, className }: MeLinkItemProps) {
  const inner = (
    <>
      <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </>
  );
  const sharedClass = cn(
    "flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left shadow-(--es-shadow-xs) transition-colors hover:bg-muted/40",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={sharedClass}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={sharedClass}>
      {inner}
    </button>
  );
}
