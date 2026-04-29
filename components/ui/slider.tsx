"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

interface SliderProps extends Omit<SliderPrimitive.Root.Props, "render"> {
  /** Label rendered visually above the thumb on hover/active. */
  showValueOnDrag?: boolean;
}

function Slider({
  className,
  showValueOnDrag = false,
  ...props
}: SliderProps) {
  const values = Array.isArray(props.value)
    ? props.value
    : Array.isArray(props.defaultValue)
      ? props.defaultValue
      : [props.defaultValue ?? 0];
  const thumbCount = values.length;

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex h-5 w-full items-center">
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[var(--es-neutral-200)]">
          <SliderPrimitive.Indicator className="absolute h-full rounded-full bg-[var(--es-accent-600)]" />
        </SliderPrimitive.Track>
        {Array.from({ length: thumbCount }).map((_, i) => (
          <SliderPrimitive.Thumb
            key={i}
            className={cn(
              "block size-4 cursor-grab rounded-full border-2 border-[var(--es-accent-600)] bg-white shadow-[var(--es-shadow-sm)]",
              "outline-none transition-[transform,box-shadow] duration-100",
              "hover:scale-110",
              "focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "data-active:cursor-grabbing data-active:scale-110",
            )}
          >
            {showValueOnDrag && (
              <SliderPrimitive.Value
                className={cn(
                  "tabular-nums absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-[var(--es-neutral-900)] px-1.5 py-0.5 text-[11px] font-semibold text-white",
                  "opacity-0 transition-opacity",
                  "group-hover:opacity-100 data-[active=true]:opacity-100",
                )}
              />
            )}
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
