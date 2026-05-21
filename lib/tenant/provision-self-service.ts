// Self-service tenant provisioning pipeline
// Triggered after email verification from the signup flow.
//
// Steps:
//   1. Validate slug unique + 1-trial-per-email rule
//   2. Create/reuse CP User + create CP Tenant (PROVISIONING)
//   3. Create Neon branch + wait ready
//   4. Encrypt + store connection URIs
//   5. Run prisma migrate deploy on new branch
//   6. Seed tenant DB + create Admin Employee + TenantMembership
//   7. Flip status → READY, send welcome email
//
// Failure at any step → rollback Neon branch + mark FAILED

import { getControlPlane } from "@/lib/db/control-plane";
import { encryptUrl } from "@/lib/db/url-encryption";
import { hashPassword, generateTempPassword } from "@/lib/auth/password-utils";
import {
  createBranch,
  waitForBranchReady,
  getConnectionUri,
  deleteBranch,
  NeonError,
} from "@/lib/neon/client";
import { provisionTenantDb } from "./provision";
import { isReservedSlug } from "./reserved-slugs";
import { sendNotificationEmail } from "@/lib/email/notification-service";

const NEON_ROLE = process.env.NEON_BRANCH_ROLE_NAME ?? "neondb_owner";
const NEON_PARENT_BRANCH_ID = process.env.NEON_PARENT_BRANCH_ID ?? "";
const APP_URL = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const TRIAL_DURATION_DAYS = parseInt(process.env.TRIAL_DURATION_DAYS ?? "30", 10);

export type ProvisionSelfServiceResult =
  | { ok: true; tenantId: string; slug: string; tempPassword: string }
  | { ok: false; error: string; code: string };

export async function provisionTenantSelfService(opts: {
  signupId: string;
  companyName: string;
  slug: string;
  adminEmail: string;
  adminName: string;
}): Promise<ProvisionSelfServiceResult> {
  const { signupId, companyName, slug, adminEmail, adminName } = opts;
  const cp = getControlPlane();

  // ── 1. Pre-flight checks ──────────────────────────────────────────
  if (isReservedSlug(slug)) {
    return { ok: false, error: "Slug is reserved", code: "SLUG_RESERVED" };
  }

  const existingTenant = await cp.tenant.findUnique({ where: { slug }, select: { id: true } });
  if (existingTenant) {
    return { ok: false, error: "Slug already taken", code: "SLUG_TAKEN" };
  }

  // 1 active trial per email
  const activeTrials = await cp.tenantMembership.count({
    where: {
      user: { email: adminEmail },
      status: "ACTIVE",
    },
  });
  if (activeTrials > 0) {
    return { ok: false, error: "An active workspace already exists for this email", code: "TRIAL_EXISTS" };
  }

  // ── 2. Create CP records ──────────────────────────────────────────
  const tempPassword = generateTempPassword(12);
  const passwordHash = await hashPassword(tempPassword);

  const cpUser = await cp.user.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, emailVerified: new Date(), passwordHash, mustChangePassword: true },
    update: {},
    select: { id: true },
  });

  const trialEndsAt = new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1_000);

  // Create Tenant row (status=PROVISIONING, no DB yet)
  const tenant = await cp.tenant.create({
    data: {
      slug,
      companyName,
      status: "TRIAL",
      provisioningStatus: "RUNNING",
      trialEndsAt,
    },
    select: { id: true },
  });

  // Update TrialSignup
  await cp.trialSignup.update({
    where: { id: signupId },
    data: { tenantId: tenant.id, status: "PROVISIONING", provisioningStartedAt: new Date() },
  });

  // ── 3-7. Neon + tenant DB setup (with rollback on failure) ────────
  let neonBranchId: string | null = null;
  try {
    // 3. Create Neon branch
    if (!NEON_PARENT_BRANCH_ID) throw new Error("NEON_PARENT_BRANCH_ID is not set");
    const { branch, endpoint } = await createBranch({
      name: `tenant-${slug}`,
      parentId: NEON_PARENT_BRANCH_ID,
    });
    neonBranchId = branch.id;

    // 4. Wait for branch ready
    await waitForBranchReady(branch.id);

    // 5. Fetch connection URIs
    const [pooledUri, directUri] = await Promise.all([
      getConnectionUri({ branchId: branch.id, role: NEON_ROLE, pooled: true }),
      getConnectionUri({ branchId: branch.id, role: NEON_ROLE, pooled: false }),
    ]);

    // 6. Encrypt + store in Tenant
    const databaseUrlEnc = encryptUrl(pooledUri);
    const directUrlEnc = encryptUrl(directUri);

    await cp.tenant.update({
      where: { id: tenant.id },
      data: {
        databaseUrlEnc,
        directUrlEnc,
        neonProjectId: process.env.NEON_PROJECT_ID,
        neonBranchId: branch.id,
        neonBranchEndpointId: endpoint.id,
        provisionedAt: new Date(),
      },
    });

    // 7. Run prisma migrate deploy + seed Admin on new branch
    const firstName = adminName.trim().split(" ")[0] ?? adminName.trim();
    const result = await provisionTenantDb({
      databaseUrl: pooledUri,
      directUrl: directUri,
      companyName,
      adminEmail,
      adminName: adminName.trim(),
      tenantId: tenant.id,
    });

    if (!result.success) {
      throw new Error(result.error ?? "provisionTenantDb failed");
    }

    // 8. Create TenantMembership — employeeRecordId comes from bootstrap-admin; re-fetch
    // The employee was created inside provisionTenantDb → bootstrap-admin handles TenantMembership
    // but let's ensure it exists here too
    const { getTenantPrisma } = await import("@/lib/db/tenant");
    const tp = await getTenantPrisma(tenant.id);
    const adminEmp = await tp.employee.findFirst({
      where: { userId: cpUser.id },
      select: { id: true },
    });

    await cp.tenantMembership.upsert({
      where: { userId_tenantId: { userId: cpUser.id, tenantId: tenant.id } },
      create: {
        userId: cpUser.id,
        tenantId: tenant.id,
        role: "TENANT_ADMIN",
        employeeRecordId: adminEmp?.id,
        status: "ACTIVE",
      },
      update: {
        employeeRecordId: adminEmp?.id,
        status: "ACTIVE",
      },
    });

    // 9. Mark READY
    await Promise.all([
      cp.tenant.update({
        where: { id: tenant.id },
        data: { provisioningStatus: "READY" },
      }),
      cp.trialSignup.update({
        where: { id: signupId },
        data: { status: "READY", provisioningCompletedAt: new Date() },
      }),
    ]);

    // 10. Send welcome email (best-effort)
    const signinUrl = `${APP_URL}/${slug}/signin`;
    sendNotificationEmail(
      adminEmail,
      `🎉 EasySlip HR พร้อมแล้ว — ${slug}`,
      welcomeEmailHtml({ name: firstName, slug, signinUrl, tempPassword }),
      `สวัสดี ${firstName} — เข้าสู่ระบบ: ${signinUrl} รหัสผ่านชั่วคราว: ${tempPassword}`,
    ).catch(() => {});

    return { ok: true, tenantId: tenant.id, slug, tempPassword };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[provision-self-service] failed:", errorMsg);

    // Rollback Neon branch if created
    if (neonBranchId) {
      deleteBranch(neonBranchId).catch((e) => {
        if (!(e instanceof NeonError)) console.error("[provision-self-service] branch cleanup failed:", e);
      });
    }

    // Mark tenant + signup as FAILED
    await Promise.allSettled([
      cp.tenant.update({
        where: { id: tenant.id },
        data: { provisioningStatus: "FAILED", provisioningError: errorMsg },
      }),
      cp.trialSignup.update({
        where: { id: signupId },
        data: { status: "FAILED", provisioningError: errorMsg },
      }),
    ]);

    return { ok: false, error: errorMsg, code: "PROVISION_FAILED" };
  }
}

function welcomeEmailHtml(opts: {
  name: string;
  slug: string;
  signinUrl: string;
  tempPassword: string;
}): string {
  const PRIMARY = "#3d46cc";
  const MUTED = "#6b7280";
  const BORDER = "#e5e7eb";
  const BG = "#f6f8fa";
  const CARD = "#ffffff";
  const TEXT = "#111827";

  return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="utf-8" /><title>EasySlip HR</title></head>
<body style="margin:0;padding:0;background-color:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" style="max-width:480px;">
        <tr><td align="center" style="padding-bottom:24px;">
          <span style="font-size:22px;font-weight:700;color:${PRIMARY};">EasySlip HR</span>
        </td></tr>
        <tr><td style="background:${CARD};border:1px solid ${BORDER};border-radius:12px;padding:32px 28px;">
          <p style="margin:0 0 4px;font-size:22px;">🎉</p>
          <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:${TEXT};">ระบบพร้อมแล้ว!</p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:${MUTED};">
            สวัสดี ${opts.name} — workspace <strong>/${opts.slug}</strong> ถูกสร้างเรียบร้อยแล้ว
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
            style="background:${BG};border:1px solid ${BORDER};border-radius:8px;padding:16px;margin-bottom:24px;">
            <tr>
              <td style="font-size:13px;color:${MUTED};width:120px;padding:4px 0;">URL</td>
              <td style="font-size:13px;font-weight:500;color:${TEXT};padding:4px 0;">${opts.signinUrl}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:${MUTED};padding:4px 0;">รหัสผ่านชั่วคราว</td>
              <td style="font-size:13px;font-family:monospace;font-weight:600;color:${TEXT};padding:4px 0;">${opts.tempPassword}</td>
            </tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="border-radius:8px;background:${PRIMARY};">
              <a href="${opts.signinUrl}" target="_blank"
                style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;border-radius:8px;">
                เข้าสู่ระบบ →
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:12px;color:${MUTED};">
            ระบบจะขอให้เปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งแรก
          </p>
        </td></tr>
        <tr><td align="center" style="padding-top:20px;">
          <p style="margin:0;font-size:11px;color:${MUTED};">EasySlip HR · easyslip.app</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
