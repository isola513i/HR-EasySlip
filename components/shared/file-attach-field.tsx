"use client";

import { Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileAttachFieldProps {
  label: string;
  actionLabel: string;
  onSelect?: () => void;
  disabled?: boolean;
  fileName?: string;
  className?: string;
}

export function FileAttachField({
  label,
  actionLabel,
  onSelect,
  disabled = false,
  fileName,
  className,
}: FileAttachFieldProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--es-neutral-300)] bg-[var(--es-neutral-50)] px-4 py-6 text-center",
        className,
      )}
    >
      <Paperclip className="size-5 text-muted-foreground" aria-hidden />
      <div className="text-sm text-muted-foreground">{label}</div>
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        className={cn(
          "text-sm font-semibold text-[var(--es-accent-600)] transition-colors",
          "hover:text-[var(--es-accent-700)]",
          "disabled:cursor-not-allowed disabled:text-muted-foreground",
        )}
      >
        {fileName ?? actionLabel}
      </button>
    </div>
  );
}
