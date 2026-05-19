import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const IS_DEV = ["development", "test"].includes(process.env.NODE_ENV ?? "");
// Fall back to "test-secret-dev" in dev so E2E_TEST_SECRET is optional locally
const SECRET = process.env.E2E_TEST_SECRET ?? (IS_DEV ? "test-secret-dev" : undefined);

export async function POST(req: Request) {
  if (!IS_DEV || !SECRET) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (req.headers.get("x-test-secret") !== SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Create a session token directly (NextAuth session strategy)
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { sessionToken: token, userId: user.id, expires },
  });

  const response = NextResponse.json({ ok: true, userId: user.id });
  response.cookies.set("authjs.session-token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires,
    sameSite: "lax",
  });

  return response;
}
