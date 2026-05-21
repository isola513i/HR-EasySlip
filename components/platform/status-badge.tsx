import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  // Tenant statuses
  ACTIVE:         "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  TRIAL:          "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
  TRIAL_EXPIRED:  "bg-rose-500/15 text-rose-300 border-rose-500/20",
  SUSPENDED:      "bg-amber-500/15 text-amber-300 border-amber-500/20",
  DELETED:        "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  // Signup — manual flow
  PENDING:        "bg-slate-500/15 text-slate-300 border-slate-500/20",
  APPROVED:       "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  REJECTED:       "bg-rose-500/15 text-rose-300 border-rose-500/20",
  // Signup — self-service flow
  PENDING_EMAIL:  "bg-sky-500/15 text-sky-300 border-sky-500/20",
  EMAIL_VERIFIED: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  PROVISIONING:   "bg-violet-500/15 text-violet-300 border-violet-500/20",
  READY:          "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  FAILED:         "bg-rose-500/15 text-rose-300 border-rose-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  // Tenant statuses
  ACTIVE:         "Active",
  TRIAL:          "Trial",
  TRIAL_EXPIRED:  "Trial Expired",
  SUSPENDED:      "Suspended",
  DELETED:        "Deleted",
  // Signup — manual flow
  PENDING:        "Pending",
  APPROVED:       "Approved",
  REJECTED:       "Rejected",
  // Signup — self-service flow
  PENDING_EMAIL:  "Pending Email",
  EMAIL_VERIFIED: "Email Verified",
  PROVISIONING:   "Provisioning",
  READY:          "Ready",
  FAILED:         "Failed",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status] ?? "bg-muted/50 text-muted-foreground border-border";
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        styles,
        className
      )}
    >
      {label}
    </span>
  );
}
