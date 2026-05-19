/**
 * Creates the initial SUPER_ADMIN PlatformUser in the Control Plane DB.
 * Run once:  bun --env-file .env.local scripts/seed-platform-admin.ts
 */
import { hashPassword } from "../lib/auth/password-utils";

async function main() {
  if (!process.env.CONTROL_PLANE_DATABASE_URL) {
    console.error("CONTROL_PLANE_DATABASE_URL is not set — aborting");
    process.exit(1);
  }

  const email = process.env.PLATFORM_ADMIN_EMAIL ?? "admin@easyslip.app";
  const password = process.env.PLATFORM_ADMIN_PASSWORD ?? "EasySlip@Admin2026";

  const { getControlPlane } = await import("../lib/db/control-plane");
  const cp = getControlPlane();

  const existing = await cp.platformUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`PlatformUser already exists: ${email} (role: ${existing.role})`);
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);
  const user = await cp.platformUser.create({
    data: { email, passwordHash, role: "SUPER_ADMIN" },
  });

  console.log(`Created SUPER_ADMIN: ${user.email} (id: ${user.id})`);
  console.log(`Password: ${password}`);
  console.log("Change this password immediately after first login.");
}

main().catch((e) => { console.error(e); process.exit(1); });
