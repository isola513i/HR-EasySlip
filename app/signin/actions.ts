"use server";

import { z } from "zod";
import { signIn } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { magicLinkLimiter } from "@/lib/security/rate-limit";

export interface SignInActionState {
  status: "idle" | "sent" | "error";
  message?: string;
  email?: string;
}

export async function sendMagicLink(
  _prev: SignInActionState,
  formData: FormData,
): Promise<SignInActionState> {
  const locale = await getLocale();
  const t = getDictionary(locale);

  const parsed = z
    .object({ email: z.string().email(t.signin.emailInvalid) })
    .safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? t.signin.invalidData,
    };
  }

  const email = parsed.data.email.toLowerCase();

  // Rate limit: 3 requests per minute per email
  const limit = magicLinkLimiter.check(email);
  if (!limit.success) {
    return {
      status: "error",
      message: t.signin.rateLimited,
    };
  }

  try {
    await signIn("resend", {
      email,
      redirect: false,
      redirectTo: "/",
    });
    return {
      status: "sent",
      email,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : t.signin.emailSendFailed;
    return {
      status: "error",
      message,
    };
  }
}
