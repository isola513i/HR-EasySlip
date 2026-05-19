import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { env } from "@/lib/env";
import {
  trialSignupConfirmationHtml,
  trialSignupNotificationHtml,
  type TrialSignupEmailParams,
} from "@/lib/email/trial-signup-template";
import { apiOk, apiError } from "@/lib/api/response";
import { TrialSignupSchema } from "@/lib/validation/trial-signup";

// Simple in-memory IP rate limiter (max 3/hour/IP)
const ipStore = new Map<string, number[]>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1_000;

function checkIpLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const hits = (ipStore.get(ip) ?? []).filter((t) => t > windowStart);
  if (hits.length >= RATE_LIMIT_MAX) return false;
  hits.push(now);
  ipStore.set(ip, hits);
  return true;
}

async function isSlugTaken(slug: string): Promise<boolean> {
  if (!process.env.CONTROL_PLANE_DATABASE_URL) return false;

  try {
    const { getControlPlane } = await import("@/lib/db/control-plane");
    const cp = getControlPlane();
    const existing = await cp.tenant.findUnique({ where: { slug }, select: { id: true } });
    return !!existing;
  } catch {
    return false; // fail open — manual review is the safety net
  }
}

async function persistSignup(data: {
  companyName: string;
  desiredSlug: string;
  contactName: string;
  contactEmail: string;
  phone?: string;
  teamSize?: string;
}): Promise<void> {
  if (!process.env.CONTROL_PLANE_DATABASE_URL) return;

  try {
    const { getControlPlane } = await import("@/lib/db/control-plane");
    const cp = getControlPlane();
    await cp.trialSignup.create({
      data: {
        companyName: data.companyName,
        desiredSlug: data.desiredSlug,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.phone,
        teamSize: data.teamSize,
      },
    });
  } catch (err) {
    console.error("[marketing/signup] failed to persist TrialSignup", err);
  }
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

  if (await isSlugTaken(desiredSlug)) {
    return apiError("SLUG_TAKEN", "SLUG_TAKEN", 409);
  }

  // Persist first — email is best-effort
  await persistSignup({ companyName, desiredSlug, contactName, contactEmail: email, phone, teamSize });

  const emailParams: TrialSignupEmailParams = {
    companyName,
    contactName,
    contactEmail: email,
    desiredSlug,
    teamSize,
  };

  const notificationTo = env.SIGNUP_NOTIFICATION_EMAIL ?? env.EMAIL_FROM;
  const resend = new Resend(env.RESEND_API_KEY);

  const [confirmResult, notifyResult] = await Promise.allSettled([
    resend.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: `รับคำขอ EasySlip HR แล้ว — ${companyName}`,
      html: trialSignupConfirmationHtml(emailParams),
    }),
    resend.emails.send({
      from: env.EMAIL_FROM,
      to: notificationTo,
      subject: `[Trial Request] ${companyName} — ${desiredSlug}.easyslip.app`,
      html: trialSignupNotificationHtml(emailParams),
    }),
  ]);

  if (confirmResult.status === "rejected" || (confirmResult.status === "fulfilled" && confirmResult.value.error)) {
    const reason = confirmResult.status === "rejected" ? confirmResult.reason : confirmResult.value.error;
    console.error("[marketing/signup] confirmation email failed (non-fatal)", reason);
  }

  if (notifyResult.status === "rejected") {
    console.error("[marketing/signup] notification email failed:", notifyResult.reason);
  }

  return apiOk({ email });
}
