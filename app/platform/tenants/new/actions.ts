"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getControlPlane } from "@/lib/db/control-plane";
import { requirePlatformSession } from "@/lib/auth/platform";
import { PLATFORM_ADMIN_ROLES } from "@/lib/security/platform-rbac";
import { encryptUrl } from "@/lib/db/url-encryption";
import { provisionTenantDb } from "@/lib/tenant/provision";
import {
  createBranch,
  waitForBranchReady,
  getConnectionUri,
  deleteBranch,
  NeonError,
} from "@/lib/neon/client";

const FLASH_TEMP_PASSWORD_COOKIE = "es_platform_temp_password";

const NEON_ROLE = process.env.NEON_BRANCH_ROLE_NAME ?? "neondb_owner";
const NEON_PARENT_BRANCH_ID = process.env.NEON_PARENT_BRANCH_ID ?? "";
const CREATABLE_STATUSES = ["ACTIVE", "TRIAL"] as const;

type ActionResult = { error: string } | null;

export async function createTenant(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);

  const slug = (formData.get("slug") as string).trim().toLowerCase();
  const companyName = (formData.get("companyName") as string).trim();
  const contactEmail = (formData.get("contactEmail") as string).trim();
  const contactName = (formData.get("contactName") as string).trim();
  const status = ((formData.get("status") as string) || "ACTIVE") as (typeof CREATABLE_STATUSES)[number];

  if (!slug || !companyName || !contactEmail || !contactName) {
    return { error: "All fields are required." };
  }
  if (!CREATABLE_STATUSES.includes(status)) {
    return { error: `Invalid status. Allowed: ${CREATABLE_STATUSES.join(", ")}.` };
  }
  if (!NEON_PARENT_BRANCH_ID) {
    return { error: "NEON_PARENT_BRANCH_ID is not configured." };
  }

  const cp = getControlPlane();
  const slugTaken = await cp.tenant.findUnique({ where: { slug }, select: { id: true } });
  if (slugTaken) return { error: `Slug "${slug}" is already taken.` };

  const tenant = await cp.tenant.create({
    data: { slug, companyName, status: "PENDING", provisioningStatus: "RUNNING" },
  });

  let neonBranchId: string | null = null;
  try {
    const { branch, endpoint } = await createBranch({
      name: `tenant-${slug}`,
      parentId: NEON_PARENT_BRANCH_ID,
    });
    neonBranchId = branch.id;

    await waitForBranchReady(branch.id);

    const [pooledUri, directUri] = await Promise.all([
      getConnectionUri({ branchId: branch.id, role: NEON_ROLE, pooled: true }),
      getConnectionUri({ branchId: branch.id, role: NEON_ROLE, pooled: false }),
    ]);

    await cp.tenant.update({
      where: { id: tenant.id },
      data: {
        databaseUrlEnc: encryptUrl(pooledUri),
        directUrlEnc: encryptUrl(directUri),
        neonProjectId: process.env.NEON_PROJECT_ID,
        neonBranchId: branch.id,
        neonBranchEndpointId: endpoint.id,
        provisionedAt: new Date(),
      },
    });

    const provision = await provisionTenantDb({
      databaseUrl: pooledUri,
      directUrl: directUri,
      companyName,
      adminEmail: contactEmail,
      adminName: contactName,
      tenantId: tenant.id,
    });

    if (!provision.success) throw new Error(provision.error ?? "provisionTenantDb failed");

    if (provision.tempPassword) {
      const c = await cookies();
      c.set(FLASH_TEMP_PASSWORD_COOKIE, JSON.stringify({
        tenantId: tenant.id,
        email: contactEmail,
        password: provision.tempPassword,
      }), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 10,
        path: "/platform",
      });
    }

    await Promise.all([
      cp.tenant.update({ where: { id: tenant.id }, data: { status, provisioningStatus: "READY" } }),
      cp.platformAuditLog.create({
        data: {
          actorId: session.userId,
          tenantId: tenant.id,
          action: "tenant.create_manual",
          metadata: { slug, companyName, status },
        },
      }),
    ]);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (neonBranchId) {
      deleteBranch(neonBranchId).catch((e) => {
        if (!(e instanceof NeonError)) console.error("[create-tenant] branch cleanup failed:", e);
      });
    }
    await cp.tenant.update({
      where: { id: tenant.id },
      data: { provisioningStatus: "FAILED", provisioningError: errorMsg },
    }).catch(() => {});
    return { error: `Provisioning failed: ${errorMsg}` };
  }

  redirect(`/platform/tenants/${tenant.id}`);
}
