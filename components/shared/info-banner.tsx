import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type InfoBannerTone = "info" | "accent" | "warn" | "success" | "error";

interface InfoBannerProps {
  tone?: InfoBannerTone;
  className?: string;
  children: ReactNode;
}

const TONE_CLASSES: Record<InfoBannerTone, string> = {
  info: "bg-(--es-info-50) text-(--es-info-600) border-(--es-info-100)",
  accent: "bg-(--es-accent-50) text-(--es-accent-700) border-(--es-accent-100)",
  warn: "bg-(--es-warn-50) text-(--es-warn-700) border-(--es-warn-100)",
  success: "bg-(--es-success-50) text-(--es-success-700) border-(--es-success-100)",
  error: "bg-(--es-error-50) text-(--es-error-700) border-(--es-error-100)",
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
