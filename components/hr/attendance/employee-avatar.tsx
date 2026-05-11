"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const PALETTE = [
  "bg-(--es-accent-100) text-(--es-accent-700)",
  "bg-(--es-success-50) text-(--es-success-700)",
  "bg-(--es-warn-50) text-(--es-warn-700)",
  "bg-(--es-error-50) text-(--es-error-700)",
  "bg-(--es-info-50) text-(--es-info-600)",
  "bg-(--es-neutral-100) text-(--es-neutral-700)",
];

function hashToIndex(seed: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

interface Props {
  seed: string;
  initials: string;
  size?: "sm" | "md" | "lg";
  pictureSrc?: string | null;
  className?: string;
}

const SIZE = { sm: "size-7 text-[11px]", md: "size-9 text-xs", lg: "size-11 text-sm" };

export function EmployeeAvatar({ seed, initials, size = "md", pictureSrc, className }: Props) {
  const tone = PALETTE[hashToIndex(seed, PALETTE.length)];
  // Track <img> 404s (proxy unauthorized, blob deleted out of band, etc.)
  // so we don't render the browser's broken-image glyph in HR lists.
  const [errored, setErrored] = useState(false);
  if (pictureSrc && !errored) {
    return (
      <img
        src={pictureSrc}
        alt=""
        onError={() => setErrored(true)}
        className={cn(
          "shrink-0 rounded-full object-cover",
          SIZE[size].split(" ")[0], // size-X only
          className,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold",
        SIZE[size],
        tone,
        className,
      )}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}
