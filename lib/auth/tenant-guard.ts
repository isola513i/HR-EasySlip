import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export interface MembershipContext {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  role: string;
  employeeRecordId: string;
  membershipStatus: string;
}

/**
 * Verifies the authenticated user has ACTIVE membership in the current tenant.
 * Call this from [slug]/layout.tsx to block cross-tenant URL tampering.
 *
 * - Unauthenticated → redirect to /{slug}/signin
 * - No membership / suspended → redirect to /workspaces?error=no_access
 * - Returns membership context on success
 */
export async function requireTenantMembership(): Promise<MembershipContext> {
  const [session, h] = await Promise.all([auth(), headers()]);
  const tenantId = h.get("x-tenant-id") ?? "";
  const tenantSlug = h.get("x-tenant-slug") ?? "";

  if (!session?.user?.id) {
    redirect(tenantSlug ? `/${tenantSlug}/signin` : "/workspaces");
  }

  const membership = session.user.memberships?.find(
    (m) => m.tenantId === tenantId,
  );

  if (!membership || membership.status !== "ACTIVE") {
    redirect("/workspaces?error=no_access");
  }

  return {
    userId: session.user.id,
    tenantId,
    tenantSlug,
    role: membership.role,
    employeeRecordId: membership.employeeRecordId,
    membershipStatus: membership.status,
  };
}

/**
 * API-route variant: returns 401/403 NextResponse instead of redirecting.
 */
export async function requireApiTenantMembership(): Promise<
  MembershipContext | NextResponse
> {
  const [session, h] = await Promise.all([auth(), headers()]);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = h.get("x-tenant-id") ?? "";
  const membership = session.user.memberships?.find(
    (m) => m.tenantId === tenantId,
  );

  if (!membership || membership.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Forbidden", message: "No active membership in this workspace" },
      { status: 403 },
    );
  }

  return {
    userId: session.user.id,
    tenantId,
    tenantSlug: h.get("x-tenant-slug") ?? "",
    role: membership.role,
    employeeRecordId: membership.employeeRecordId,
    membershipStatus: membership.status,
  };
}
