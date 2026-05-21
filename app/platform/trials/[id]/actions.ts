"use server";

import { revalidatePath } from "next/cache";
import { getControlPlane } from "@/lib/db/control-plane";
import { requirePlatformSession } from "@/lib/auth/platform";
import { encryptUrl } from "@/lib/db/url-encryption";
import { PLATFORM_ADMIN_ROLES } from "@/lib/security/platform-rbac";
import { provisionTenantDb } from "@/lib/tenant/provision";
import { env } from "@/lib/env";
import { Resend } from "resend";

const resend = new Resend(env.RESEND_API_KEY);

type ActionResult = { error: string } | { success: true } | null;

export async function approveTrialSignup(signupId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  const cp = getControlPlane();

  const slug = (formData.get("slug") as string).trim().toLowerCase();
  const companyName = (formData.get("companyName") as string).trim();
  const databaseUrl = (formData.get("databaseUrl") as string).trim();
  const directUrl = (formData.get("directUrl") as string | null)?.trim() || null;
  const trialDays = parseInt(process.env.TRIAL_DURATION_DAYS ?? "7", 10);

  if (!slug || !companyName || !databaseUrl) return { error: "slug, companyName, and databaseUrl are required." };

  // Parallel: fetch signup + check slug uniqueness
  const [signup, slugTaken] = await Promise.all([
    cp.trialSignup.findUnique({ where: { id: signupId } }),
    cp.tenant.findUnique({ where: { slug }, select: { id: true } }),
  ]);
  if (!signup || signup.status !== "PENDING") return { error: "Signup not found or already reviewed." };
  if (slugTaken) return { error: `Slug "${slug}" is already taken.` };

  const databaseUrlEnc = encryptUrl(databaseUrl);
  const directUrlEnc = directUrl ? encryptUrl(directUrl) : null;
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

  const tenant = await cp.tenant.create({
    data: { slug, companyName, status: "TRIAL", databaseUrlEnc, directUrlEnc, trialEndsAt, provisionedAt: now },
  });

  await cp.trialSignup.update({
    where: { id: signupId },
    data: { status: "APPROVED", reviewedAt: now, tenantId: tenant.id },
  });

  const provision = await provisionTenantDb({
    databaseUrl, directUrl, companyName, adminEmail: signup.contactEmail, adminName: signup.contactName,
  });

  if (!provision.success) {
    await Promise.all([
      cp.tenant.delete({ where: { id: tenant.id } }),
      cp.trialSignup.update({ where: { id: signupId }, data: { status: "PENDING", reviewedAt: null, tenantId: null } }),
    ]);
    return { error: provision.error ?? "Provisioning failed. Check DB credentials and retry." };
  }

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/${slug}/signin`;
  const passwordLine = provision.tempPassword
    ? `<p>Temporary password: <strong>${provision.tempPassword}</strong><br>You will be prompted to change it on first login.</p>`
    : "";

  // Parallel: write audit log + send email (email is already fire-and-forget)
  await Promise.all([
    cp.platformAuditLog.create({
      data: {
        actorId: session.userId,
        tenantId: tenant.id,
        action: "trial.approve",
        targetType: "TrialSignup",
        targetId: signupId,
        metadata: { slug, companyName, trialEndsAt: trialEndsAt.toISOString() },
      },
    }),
    resend.emails.send({
      from: env.EMAIL_FROM,
      to: signup.contactEmail,
      subject: "Your EasySlip trial is ready!",
      html: `<p>Hi ${signup.contactName},</p>
<p>Your ${trialDays}-day free trial has been approved! Access your HR portal at:</p>
<p><strong><a href="${portalUrl}">${portalUrl}</a></strong></p>
${passwordLine}
<p>Trial ends: ${trialEndsAt.toLocaleDateString("en-GB")}</p>
<p>— EasySlip Team</p>`,
    }).catch((err) => console.error("[trial.approve] email failed", err)),
  ]);

  revalidatePath("/platform/trials");
  revalidatePath(`/platform/trials/${signupId}`);
  return { success: true };
}

export async function rejectTrialSignup(signupId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  const cp = getControlPlane();

  const reason = (formData.get("rejectReason") as string | null)?.trim() ?? "";
  const signup = await cp.trialSignup.findUnique({ where: { id: signupId } });
  if (!signup || signup.status !== "PENDING") return { error: "Signup not found or already reviewed." };

  await Promise.all([
    cp.trialSignup.update({
      where: { id: signupId },
      data: { status: "REJECTED", rejectReason: reason || null, reviewedAt: new Date() },
    }),
    cp.platformAuditLog.create({
      data: {
        actorId: session.userId,
        action: "trial.reject",
        targetType: "TrialSignup",
        targetId: signupId,
        metadata: { reason },
      },
    }),
  ]);

  revalidatePath("/platform/trials");
  revalidatePath(`/platform/trials/${signupId}`);
  return { success: true };
}
