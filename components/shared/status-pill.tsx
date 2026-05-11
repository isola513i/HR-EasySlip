import { cn } from "@/lib/utils";

type PillTone = "success" | "warn" | "error" | "info" | "neutral" | "accent";

const toneClasses: Record<PillTone, string> = {
  success: "bg-(--es-success-50) text-(--es-success-700)",
  warn: "bg-(--es-warn-50) text-(--es-warn-700)",
  error: "bg-(--es-error-50) text-(--es-error-700)",
  info: "bg-(--es-info-50) text-(--es-info-600)",
  neutral: "bg-(--es-neutral-100) text-(--es-neutral-700)",
  accent: "bg-(--es-accent-50) text-(--es-accent-700)",
};

const dotColors: Record<PillTone, string> = {
  success: "bg-(--es-success-500)",
  warn: "bg-(--es-warn-500)",
  error: "bg-(--es-error-500)",
  info: "bg-(--es-info-500)",
  neutral: "bg-(--es-neutral-500)",
  accent: "bg-(--es-accent-500)",
};

interface StatusPillProps {
  tone?: PillTone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function StatusPill({
  tone = "neutral",
  dot = true,
  children,
  className,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn("size-[5px] shrink-0 rounded-full", dotColors[tone])}
        />
      )}
      {children}
    </span>
  );
}
