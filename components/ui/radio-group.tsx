"use client";

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";

import { cn } from "@/lib/utils";

function RadioGroup({
  className,
  ...props
}: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        "group/radio inline-grid size-4 shrink-0 cursor-pointer place-items-center rounded-full border border-(--es-neutral-300) bg-card outline-none transition-colors",
        "hover:border-(--es-accent-400)",
        "focus-visible:ring-2 focus-visible:ring-(--ring)",
        "data-checked:border-(--es-accent-600) data-checked:bg-(--es-accent-600)",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator className="size-1.5 rounded-full bg-white opacity-0 group-data-checked/radio:opacity-100 transition-opacity" />
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
