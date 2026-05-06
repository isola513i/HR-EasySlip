"use client";

import { type ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionProps {
  className?: string;
  children: ReactNode;
}

export function Accordion({ className, children }: AccordionProps) {
  return <div className={cn("flex flex-col gap-2", className)}>{children}</div>;
}

interface AccordionItemProps {
  title: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}

export function AccordionItem({
  title,
  defaultOpen = false,
  className,
  children,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--es-shadow-xs)]",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
      >
        <span className="flex-1 text-sm font-semibold text-foreground">{title}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="border-t border-[var(--es-neutral-100)] px-4 py-4">{children}</div>}
    </div>
  );
}
