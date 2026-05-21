"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getControlPlane } from "@/lib/db/control-plane";
import { verifyPassword } from "@/lib/auth/password-utils";
import { createPlatformSession, PLATFORM_COOKIE_NAME } from "@/lib/auth/platform";

type ActionResult = { error: string } | { redirectUrl: string } | null;

export async function platformSignIn(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!email || !password) return { error: "Email and password are required." };

  const cp = getControlPlane();
  const user = await cp.platformUser.findUnique({ where: { email } });

  if (!user || user.isDisabled) return { error: "Invalid credentials." };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "Invalid credentials." };

  await cp.platformUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await cp.platformAuditLog.create({
    data: {
      actorId: user.id,
      action: "platform.signin",
      targetType: "PlatformUser",
      targetId: user.id,
    },
  });

  const token = await createPlatformSession({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const jar = await cookies();
  jar.set(PLATFORM_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  const h = await headers();
  const host = h.get("host") ?? "admin.localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return { redirectUrl: `${protocol}://${host}/platform/overview` };
}

export async function platformSignOut() {
  const jar = await cookies();
  jar.delete(PLATFORM_COOKIE_NAME);
  redirect("/platform/signin");
}
