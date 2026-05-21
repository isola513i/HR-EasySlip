/**
 * Canonical list of path segments that are never tenant slugs.
 * Used by middleware to skip tenant resolution, and by signup validation
 * to prevent slug squatting.
 */
export const RESERVED_SLUGS = new Set([
  // Auth & workspace management
  "signin",
  "signup",
  "login",
  "workspaces",
  "no-workspace",
  // Marketing & info pages
  "pricing",
  "terms",
  "privacy",
  "about",
  "blog",
  "docs",
  "help",
  "support",
  "status",
  // Static & system
  "offline",
  "icons",
  "fonts",
  "images",
  "mock",
  "static",
  "assets",
  "health",
  "error",
  // Squatting protection
  "admin",
  "www",
  "mail",
  "dev",
  "demo",
  "test",
  "staging",
  "app",
  "api",
]);

/** Minimum 3-char slug: letter/digit, then 1-28 chars, ends with letter/digit */
export const TENANT_SLUG_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
