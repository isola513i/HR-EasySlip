import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type InfoBannerTone = "info" | "accent" | "warn" | "success" | "error";

interface InfoBannerProps {
  tone?: InfoBannerTone;
  className?: string;
  children: ReactNode;
}

const TONE_CLASSES: Record<InfoBannerTone, string> = {
  info: "bg-[var(--es-info-50)] text-[var(--es-info-600)] border-[var(--es-info-100)]",
  accent: "bg-[var(--es-accent-50)] text-[var(--es-accent-700)] border-[var(--es-accent-100)]",
  warn: "bg-[var(--es-warn-50)] text-[var(--es-warn-700)] border-[var(--es-warn-100)]",
  success: "bg-[var(--es-success-50)] text-[var(--es-success-700)] border-[var(--es-success-100)]",
  error: "bg-[var(--es-error-50)] text-[var(--es-error-700)] border-[var(--es-error-100)]",
};

export function InfoBanner({ tone = "info", className, children }: InfoBannerProps) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm leading-relaxed",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
