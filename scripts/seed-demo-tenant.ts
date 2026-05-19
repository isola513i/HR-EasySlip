/**
 * One-shot script: provisions the current DATABASE_URL as the "demo" tenant
 * in the Control Plane DB.
 *
 * Run with:
 *   bun --env-file .env.local scripts/seed-demo-tenant.ts
 *
 * This is idempotent — running it twice updates rather than duplicates.
 */

import { PrismaClient } from "../lib/db/generated/control-plane";
import { encryptUrl } from "../lib/db/url-encryption";

const DATABASE_URL = process.env.DATABASE_URL;
const DIRECT_URL = process.env.DIRECT_URL;
const CP_URL = process.env.CONTROL_PLANE_DATABASE_URL;
const CP_DIRECT = process.env.CONTROL_PLANE_DIRECT_URL;
const ENCRYPTION_KEY = process.env.CONTROL_PLANE_ENCRYPTION_KEY;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set in .env.local");
  process.exit(1);
}
if (!CP_URL) {
  console.error("❌ CONTROL_PLANE_DATABASE_URL is not set in .env.local");
  process.exit(1);
}
if (!ENCRYPTION_KEY) {
  console.error("❌ CONTROL_PLANE_ENCRYPTION_KEY is not set in .env.local");
  process.exit(1);
}

const cp = new PrismaClient({
  datasources: { db: { url: CP_URL } },
  log: ["warn", "error"],
});

async function main() {
  console.log("🔑 Encrypting DATABASE_URL...");
  const databaseUrlEnc = encryptUrl(DATABASE_URL!);
  const directUrlEnc = DIRECT_URL ? encryptUrl(DIRECT_URL) : null;

  console.log("🏗️  Upserting demo tenant in Control Plane DB...");
  const tenant = await cp.tenant.upsert({
    where: { slug: "demo" },
    create: {
      slug: "demo",
      companyName: "EasySlip Demo",
      status: "ACTIVE",
      databaseUrlEnc,
      directUrlEnc,
      provisionedAt: new Date(),
    },
    update: {
      companyName: "EasySlip Demo",
      status: "ACTIVE",
      databaseUrlEnc,
      directUrlEnc,
    },
  });

  console.log(`\n✅ Demo tenant provisioned!`);
  console.log(`   ID:   ${tenant.id}`);
  console.log(`   Slug: ${tenant.slug}`);
  console.log(`   Status: ${tenant.status}`);
  console.log(`\n📌 Local dev — access the system at:`);
  console.log(`   http://demo.localhost:3000`);
  console.log(`   (Chrome supports *.localhost natively — no /etc/hosts changes needed)`);
}

main()
  .catch((err) => {
    console.error("❌ Failed:", err);
    process.exit(1);
  })
  .finally(() => cp.$disconnect());
