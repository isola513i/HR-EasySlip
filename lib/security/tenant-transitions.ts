export const TENANT_STATUS_TRANSITIONS = {
  PENDING: [
    { label: "Activate", variant: "default" as const, nextStatus: "ACTIVE" },
    { label: "Set Trial", variant: "outline" as const, nextStatus: "TRIAL" },
  ],
  TRIAL: [
    { label: "Activate", variant: "default" as const, nextStatus: "ACTIVE" },
    { label: "Suspend", variant: "destructive" as const, nextStatus: "SUSPENDED" },
  ],
  TRIAL_EXPIRED: [
    { label: "Activate", variant: "default" as const, nextStatus: "ACTIVE" },
    { label: "Suspend", variant: "destructive" as const, nextStatus: "SUSPENDED" },
  ],
  ACTIVE: [
    { label: "Suspend", variant: "destructive" as const, nextStatus: "SUSPENDED" },
  ],
  SUSPENDED: [
    { label: "Re-activate", variant: "default" as const, nextStatus: "ACTIVE" },
    { label: "Delete", variant: "destructive" as const, nextStatus: "DELETED" },
  ],
} as const;

export const ALLOWED_TRANSITIONS: Record<string, string[]> = Object.fromEntries(
  Object.entries(TENANT_STATUS_TRANSITIONS).map(([from, opts]) => [from, opts.map((o) => o.nextStatus)])
);
