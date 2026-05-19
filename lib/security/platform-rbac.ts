import type { PlatformRole } from "@/lib/db/generated/control-plane";

export const PLATFORM_ADMIN_ROLES: PlatformRole[] = ["SUPER_ADMIN"];
export const PLATFORM_VIEWER_ROLES: PlatformRole[] = ["SUPER_ADMIN", "SUPPORT", "BILLING"];
export const PLATFORM_TRIAL_ROLES: PlatformRole[] = ["SUPER_ADMIN", "SUPPORT"];
