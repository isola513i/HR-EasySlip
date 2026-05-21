import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { HR_LANDING_ROLES } from "@/lib/security/role-helpers";

export default async function TenantRootPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user) redirect(`/${slug}/signin`);
  if (session.user.mustChangePassword) redirect(`/${slug}/change-password`);

  const membership = session.user.memberships?.find((m) => m.tenantSlug === slug);
  if (!membership) redirect("/workspaces?error=no_access");

  const landing = HR_LANDING_ROLES.has(membership.role) ? "hr/overview" : "employee/today";
  redirect(`/${slug}/${landing}`);
}
