/**
 * Runs `prisma migrate deploy` against every active/trial tenant DB.
 * Run before deploying schema changes:
 *   bun --env-file .env.local scripts/migrate-all-tenants.ts
 *   bun --env-file .env.local scripts/migrate-all-tenants.ts --dry-run
 */
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execAsync = promisify(exec);
const isDryRun = process.argv.includes("--dry-run");

async function main() {
  if (!process.env.CONTROL_PLANE_DATABASE_URL) {
    console.error("CONTROL_PLANE_DATABASE_URL is not set — aborting");
    process.exit(1);
  }

  const { getControlPlane } = await import("../lib/db/control-plane");
  const { decryptUrl } = await import("../lib/db/url-encryption");

  const cp = getControlPlane();
  const tenants = await cp.tenant.findMany({
    where: { status: { in: ["ACTIVE", "TRIAL"] }, databaseUrlEnc: { not: null } },
    select: { id: true, slug: true, databaseUrlEnc: true, directUrlEnc: true },
  });

  console.log(`Found ${tenants.length} tenant(s) to migrate${isDryRun ? " (dry run)" : ""}`);

  const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
  const results: { slug: string; status: "ok" | "error"; message?: string }[] = [];

  for (const t of tenants) {
    const databaseUrl = decryptUrl(t.databaseUrlEnc!);
    const directUrl = t.directUrlEnc ? decryptUrl(t.directUrlEnc) : databaseUrl;

    if (isDryRun) {
      console.log(`  [dry-run] would migrate: ${t.slug}`);
      continue;
    }

    process.stdout.write(`  Migrating ${t.slug}… `);
    try {
      await execAsync(`bun prisma migrate deploy --schema="${schemaPath}"`, {
        env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: directUrl },
        timeout: 120_000,
      });
      console.log("✓");
      results.push({ slug: t.slug, status: "ok" });
    } catch (err) {
      const message = (err as Error).message.split("\n")[0];
      console.log(`✗ ${message}`);
      results.push({ slug: t.slug, status: "error", message });
    }
  }

  if (!isDryRun) {
    const failed = results.filter((r) => r.status === "error");
    if (failed.length > 0) {
      console.error(`\n${failed.length} migration(s) failed:`);
      for (const f of failed) console.error(`  - ${f.slug}: ${f.message}`);
      process.exit(1);
    }
    console.log(`\nAll ${results.length} migration(s) succeeded.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
