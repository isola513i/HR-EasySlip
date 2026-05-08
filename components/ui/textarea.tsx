import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-xl border border-input bg-transparent px-3.5 py-2.5 text-[13px] shadow-[inset_0_1px_0_rgba(15,23,42,0.02)] transition-[border-color,box-shadow] duration-150 outline-none",
        "placeholder:text-muted-foreground/70",
        "hover:border-[var(--es-neutral-300)]",
        "focus-visible:border-[var(--es-accent-400)] focus-visible:ring-[3px] focus-visible:ring-ring/40",
        "disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-60",
        "aria-invalid:border-destructive/60 aria-invalid:ring-[3px] aria-invalid:ring-destructive/15",
        "md:text-[13px] dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
