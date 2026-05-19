export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getControlPlane } from "@/lib/db/control-plane";
import { createPlatformSession, PLATFORM_COOKIE_NAME } from "@/lib/auth/platform";

const IS_DEV = ["development", "test"].includes(process.env.NODE_ENV ?? "");
const SECRET = process.env.E2E_TEST_SECRET ?? (IS_DEV ? "test-secret-dev" : undefined);

export async function POST(req: Request) {
  if (!IS_DEV || !SECRET) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (req.headers.get("x-test-secret") !== SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const cp = getControlPlane();
  const user = await cp.platformUser.findUnique({ where: { email } });
  if (!user || user.isDisabled) {
    return NextResponse.json({ error: "Platform user not found" }, { status: 404 });
  }

  const token = await createPlatformSession({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const response = NextResponse.json({ ok: true, role: user.role });
  response.cookies.set(PLATFORM_COOKIE_NAME, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
