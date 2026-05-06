import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionLabelProps {
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

export function SectionLabel({ htmlFor, className, children }: SectionLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-2 block text-sm font-bold text-foreground", className)}
    >
      {children}
    </label>
  );
}
