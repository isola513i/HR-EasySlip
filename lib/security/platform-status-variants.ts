type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export const TENANT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  ACTIVE: "secondary",
  TRIAL: "default",
  PENDING: "outline",
  TRIAL_EXPIRED: "destructive",
  SUSPENDED: "destructive",
  DELETED: "destructive",
};

export const SIGNUP_STATUS_VARIANT: Record<string, BadgeVariant> = {
  PENDING: "default",
  APPROVED: "secondary",
  REJECTED: "destructive",
};
