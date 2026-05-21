import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { apiOk, apiError } from "@/lib/api/response";
import { TrialSignupSchema } from "@/lib/validation/trial-signup";
import { isReservedSlug } from "@/lib/tenant/reserved-slugs";

// In-memory IP rate limiter (max 3 signups/hour/IP)
const ipStore = new Map<string, number[]>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1_000;

function checkIpLimit(ip: string): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const hits = (ipStore.get(ip) ?? []).filter((t) => t > windowStart);
  if (hits.length >= RATE_LIMIT_MAX) return false;
  hits.push(now);
  ipStore.set(ip, hits);
  if (ipStore.size > 5_000) {
    for (const [k, v] of ipStore) if (v.every((t) => t <= windowStart)) ipStore.delete(k);
  }
  return true;
}

async function sendVerificationEmail(opts: {
  to: string;
  contactName: string;
  companyName: string;
  verifyUrl: string;
}): Promise<void> {
  const resend = new Resend(env.RESEND_API_KEY);
  const html = verificationEmailHtml(opts);
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: opts.to,
    subject: `ยืนยัน Email เพื่อสร้าง EasySlip HR — ${opts.companyName}`,
    html,
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkIpLimit(ip)) {
    return apiError("RATE_LIMIT", "Too many requests", 429);
  }

  let body: z.infer<typeof TrialSignupSchema>;
  try {
    body = TrialSignupSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      const slugIssue = err.issues.find((i) => i.message === "SLUG_INVALID");
      if (slugIssue) return apiError("SLUG_INVALID", "SLUG_INVALID", 400);
      return apiError("VALIDATION_ERROR", "VALIDATION_ERROR", 400);
    }
    return apiError("VALIDATION_ERROR", "VALIDATION_ERROR", 400);
  }

  const { companyName, desiredSlug, contactName, email, phone, teamSize } = body;

  if (isReservedSlug(desiredSlug)) {
    return apiError("SLUG_TAKEN", "SLUG_TAKEN", 409);
  }

  if (!process.env.CONTROL_PLANE_DATABASE_URL) {
    // Fallback: legacy manual-review flow
    return legacySignupFlow({ companyName, desiredSlug, contactName, email, phone, teamSize });
  }

  const { getControlPlane } = await import("@/lib/db/control-plane");
  const cp = getControlPlane();

  // Check slug uniqueness
  const existing = await cp.tenant.findUnique({ where: { slug: desiredSlug }, select: { id: true } });
  if (existing) return apiError("SLUG_TAKEN", "SLUG_TAKEN", 409);

  // 1 active trial per email
  const activeTrials = await cp.tenantMembership.count({
    where: { user: { email }, status: "ACTIVE" },
  });
  if (activeTrials > 0) {
    return apiError("TRIAL_EXISTS", "An active workspace already exists for this email", 409);
  }

  // Create TrialSignup + EmailVerification in one transaction
  const verificationToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1_000); // 24h

  const signup = await cp.trialSignup.create({
    data: {
      companyName,
      desiredSlug,
      contactName,
      contactEmail: email,
      contactPhone: phone,
      teamSize,
      status: "PENDING_EMAIL",
      emailVerifications: {
        create: {
          token: verificationToken,
          email,
          purpose: "TRIAL_SIGNUP",
          expiresAt,
        },
      },
    },
    select: { id: true },
  });

  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verifyUrl = `${appUrl}/signup/verify?token=${verificationToken}`;

  if (process.env.NODE_ENV === "development") {
    console.log(`\n[DEV] ✉️  Verification link for ${email}:\n  ${verifyUrl}\n`);
  }

  try {
    await sendVerificationEmail({ to: email, contactName, companyName, verifyUrl });
  } catch (err) {
    console.error("[marketing/signup] verification email failed:", err);
  }

  // Also notify platform team (best-effort)
  const notificationTo = env.SIGNUP_NOTIFICATION_EMAIL ?? env.EMAIL_FROM;
  const resend = new Resend(env.RESEND_API_KEY);
  resend.emails.send({
    from: env.EMAIL_FROM,
    to: notificationTo,
    subject: `[Trial Signup] ${companyName} — /${desiredSlug}`,
    html: `<p>New self-service signup: <strong>${companyName}</strong> (/${desiredSlug}) — ${email}</p><p>Signup ID: ${signup.id}</p>`,
  }).catch(() => {});

  return apiOk({ email, signupId: signup.id });
}

// Legacy flow: no CP wired, send manual-review emails instead
async function legacySignupFlow(data: {
  companyName: string;
  desiredSlug: string;
  contactName: string;
  email: string;
  phone?: string;
  teamSize?: string;
}): Promise<NextResponse> {
  const { trialSignupConfirmationHtml, trialSignupNotificationHtml } = await import("@/lib/email/trial-signup-template");
  const resend = new Resend(env.RESEND_API_KEY);
  const notificationTo = env.SIGNUP_NOTIFICATION_EMAIL ?? env.EMAIL_FROM;

  const emailParams = {
    companyName: data.companyName,
    contactName: data.contactName,
    contactEmail: data.email,
    desiredSlug: data.desiredSlug,
    teamSize: data.teamSize,
  };

  await Promise.allSettled([
    resend.emails.send({
      from: env.EMAIL_FROM,
      to: data.email,
      subject: `รับคำขอ EasySlip HR แล้ว — ${data.companyName}`,
      html: trialSignupConfirmationHtml(emailParams),
    }),
    resend.emails.send({
      from: env.EMAIL_FROM,
      to: notificationTo,
      subject: `[Trial Request] ${data.companyName} — /${data.desiredSlug}`,
      html: trialSignupNotificationHtml(emailParams),
    }),
  ]);

  return apiOk({ email: data.email });
}

function verificationEmailHtml(opts: {
  contactName: string;
  companyName: string;
  verifyUrl: string;
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
          <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:${TEXT};">ยืนยัน Email ของคุณ</p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:${MUTED};">
            สวัสดี ${opts.contactName} — กดปุ่มด้านล่างเพื่อยืนยัน Email และสร้าง workspace สำหรับ <strong>${opts.companyName}</strong>
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="border-radius:8px;background:${PRIMARY};">
              <a href="${opts.verifyUrl}" target="_blank"
                style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;border-radius:8px;">
                ยืนยัน Email →
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:13px;color:${MUTED};">Link นี้ใช้ได้ 24 ชั่วโมง</p>
          <p style="margin:0;font-size:12px;color:${MUTED};">ถ้าคุณไม่ได้สมัคร ไม่ต้องทำอะไร</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
