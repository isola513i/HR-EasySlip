import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { HR_LANDING_ROLES } from "@/lib/security/rbac";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/get-locale";
import { WorkspacePicker } from "./workspace-picker";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.workspaces?.pageTitle ?? "Select Workspace" };
}

export default async function WorkspacesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [session, { error }, locale] = await Promise.all([
    auth(),
    searchParams,
    getLocale(),
  ]);
  const t = getDictionary(locale);

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const memberships = session.user.memberships ?? [];

  // No workspaces → show no-workspace page
  if (memberships.length === 0) {
    redirect("/no-workspace");
  }

  // Single workspace → auto-redirect to appropriate landing
  if (memberships.length === 1) {
    const m = memberships[0];
    const landingPath = HR_LANDING_ROLES.has(m.role) ? "dashboard" : "employee/today";
    redirect(`/${m.tenantSlug}/${landingPath}`);
  }

  // Multiple workspaces → show picker
  return (
    <WorkspacePicker
      memberships={memberships}
      error={error}
      t={t}
    />
  );
}
