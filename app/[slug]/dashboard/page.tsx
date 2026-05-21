import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { HR_LANDING_ROLES } from "@/lib/security/rbac";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, session] = await Promise.all([params, auth()]);

  if (!session?.user) {
    redirect(`/${slug}/signin`);
  }

  if (session.user.mustChangePassword) {
    redirect(`/${slug}/change-password`);
  }

  const membership = session.user.memberships?.find((m) => m.tenantSlug === slug);

  if (!membership) {
    redirect("/workspaces?error=no_access");
  }

  if (HR_LANDING_ROLES.has(membership.role)) {
    redirect(`/${slug}/hr/overview`);
  }

  redirect(`/${slug}/employee/today`);
}
