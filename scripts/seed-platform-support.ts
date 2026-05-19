/**
 * Creates a SUPPORT PlatformUser in the Control Plane DB for dev/E2E testing.
 * Run once:  bun --env-file .env.local scripts/seed-platform-support.ts
 */
import { hashPassword } from "../lib/auth/password-utils";

async function main() {
  if (!process.env.CONTROL_PLANE_DATABASE_URL) {
    console.error("CONTROL_PLANE_DATABASE_URL is not set — aborting");
    process.exit(1);
  }

  const email = process.env.PLATFORM_SUPPORT_EMAIL ?? "support@easyslip.app";
  const password = process.env.PLATFORM_SUPPORT_PASSWORD ?? "EasySlip@Support2026";

  const { getControlPlane } = await import("../lib/db/control-plane");
  const cp = getControlPlane();

  const existing = await cp.platformUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`PlatformUser already exists: ${email} (role: ${existing.role})`);
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);
  const user = await cp.platformUser.create({
    data: { email, passwordHash, role: "SUPPORT" },
  });

  console.log(`Created SUPPORT: ${user.email} (id: ${user.id})`);
  console.log(`Password: ${password}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
