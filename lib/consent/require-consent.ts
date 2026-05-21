import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantSlug } from "@/lib/db/tenant-context";
import { hasActiveConsent } from "./consent-service";

/**
 * Server-side consent check for Next.js layouts.
 * Redirects to /{slug}/consent if user hasn't given PDPA consent.
 * Safe to call when unauthenticated — skips if no session (middleware handles signin).
 */
export async function requireConsent(callbackPath: string, slug?: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const consented = await hasActiveConsent(session.user.id);
  if (!consented) {
    const tenantSlug = slug || (await getTenantSlug());
    const target = tenantSlug ? `/${tenantSlug}/consent` : "/consent";
    redirect(`${target}?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }
}
