import { cn } from "@/lib/utils";

type PillTone = "success" | "warn" | "error" | "info" | "neutral" | "accent";

const toneClasses: Record<PillTone, string> = {
  success: "bg-[var(--es-success-50)] text-[var(--es-success-700)]",
  warn: "bg-[var(--es-warn-50)] text-[var(--es-warn-700)]",
  error: "bg-[var(--es-error-50)] text-[var(--es-error-700)]",
  info: "bg-[var(--es-info-50)] text-[var(--es-info-600)]",
  neutral: "bg-[var(--es-neutral-100)] text-[var(--es-neutral-700)]",
  accent: "bg-[var(--es-accent-50)] text-[var(--es-accent-700)]",
};

const dotColors: Record<PillTone, string> = {
  success: "bg-[var(--es-success-500)]",
  warn: "bg-[var(--es-warn-500)]",
  error: "bg-[var(--es-error-500)]",
  info: "bg-[var(--es-info-500)]",
  neutral: "bg-[var(--es-neutral-500)]",
  accent: "bg-[var(--es-accent-500)]",
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
          className={cn("size-[5px] shrink-0 rounded-full", dotColors[tone])}
        />
      )}
      {children}
    </span>
  );
}
