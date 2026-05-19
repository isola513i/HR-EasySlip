import { cn } from "@/lib/utils";
import type { AuditSeverity } from "@/lib/security/audit-severity";

const STYLES: Record<AuditSeverity, string> = {
  info:     "bg-muted/60 text-muted-foreground",
  warn:     "bg-amber-500/15 text-amber-300",
  critical: "bg-rose-500/15 text-rose-300",
};

interface SeverityBadgeProps {
  severity: AuditSeverity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono uppercase tracking-wider",
        STYLES[severity],
        className
      )}
    >
      {severity}
    </span>
  );
}
