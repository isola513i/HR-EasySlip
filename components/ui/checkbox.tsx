"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-[18px] shrink-0 items-center justify-center rounded-[6px] border border-input bg-card",
        "shadow-[inset_0_1px_0_rgba(15,23,42,0.02)] transition-[background-color,border-color,box-shadow] duration-150 outline-none",
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        "group-has-disabled/field:opacity-50",
        "hover:border-(--es-neutral-300)",
        "focus-visible:border-(--es-accent-400) focus-visible:ring-[3px] focus-visible:ring-ring/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive/60 aria-invalid:ring-[3px] aria-invalid:ring-destructive/15",
        "aria-invalid:aria-checked:border-primary",
        "data-checked:border-(--es-accent-600) data-checked:bg-(--es-accent-600) data-checked:text-primary-foreground",
        "data-indeterminate:border-(--es-accent-600) data-indeterminate:bg-(--es-accent-600) data-indeterminate:text-primary-foreground",
        "dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:data-checked:bg-primary",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-[transform,opacity] duration-150 ease-out data-checked:scale-100 data-unchecked:scale-50 data-unchecked:opacity-0 [&>svg]:size-3.5"
      >
        <CheckIcon strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
