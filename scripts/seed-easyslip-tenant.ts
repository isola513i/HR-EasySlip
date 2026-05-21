/**
 * Seed script for the easyslip tenant database.
 *
 * What it does:
 *   1. Reads easyslip tenant's encrypted DB URL from the control plane
 *   2. Decrypts it
 *   3. Wipes ALL data from the tenant DB (clean slate)
 *   4. Creates 3 users: admin / manager / employee
 *
 * Run:
 *   bun scripts/seed-easyslip-tenant.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaClient as CpPrismaClient } from "../lib/db/generated/control-plane";
import bcrypt from "bcryptjs";
import { createDecipheriv } from "node:crypto";

// ── helpers ──────────────────────────────────────────────────────────────────

function decryptUrl(ciphertext: string): string {
  const keyHex = process.env.CONTROL_PLANE_ENCRYPTION_KEY ?? "";
  if (keyHex.length !== 64) throw new Error("CONTROL_PLANE_ENCRYPTION_KEY missing or wrong length");
  const key = Buffer.from(keyHex, "hex");
  const iv  = Buffer.from(ciphertext.slice(0, 24), "hex");
  const tag = Buffer.from(ciphertext.slice(24, 56), "hex");
  const enc = Buffer.from(ciphertext.slice(56), "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc) + decipher.final("utf8");
}

async function hash(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

// ── main ─────────────────────────────────────────────────────────────────────

const controlDb = new PrismaClient({
  datasources: { db: { url: process.env.CONTROL_PLANE_DATABASE_URL } },
  log: ["warn", "error"],
});
const cpDb = new CpPrismaClient({
  datasources: { db: { url: process.env.CONTROL_PLANE_DATABASE_URL } },
  log: ["warn", "error"],
});

async function main() {
  // 1. Get easyslip tenant's encrypted DB URL
  const tenant = await (controlDb as any).$queryRaw`
    SELECT "databaseUrlEnc" FROM "Tenant" WHERE slug = 'easyslip' LIMIT 1
  ` as Array<{ databaseUrlEnc: string | null }>;

  if (!tenant[0]) throw new Error('Tenant "easyslip" not found in control plane');
  if (!tenant[0].databaseUrlEnc) throw new Error('databaseUrlEnc is null — set the DB URL for easyslip tenant first');

  const tenantDbUrl = decryptUrl(tenant[0].databaseUrlEnc);
  console.log("✓ Decrypted easyslip DB URL");

  // 2. Connect to tenant DB
  const db = new PrismaClient({
    datasources: { db: { url: tenantDbUrl } },
    log: ["warn", "error"],
  });

  // 3. Wipe all data — order matters (children before parents)
  console.log("🗑  Wiping existing data...");
  await db.$executeRawUnsafe(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        AND tablename NOT IN ('_prisma_migrations')
      ) LOOP
        EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" CASCADE';
      END LOOP;
    END $$;
  `);
  console.log("✓ All tables truncated");

  // 4. Create a default department + positions
  const dept = await db.department.create({
    data: { name: "Administration", code: "ADMIN" },
  });

  const [posAdmin, posManager, posEmployee] = await Promise.all([
    db.position.create({ data: { name: "Administrator", level: 5 } }),
    db.position.create({ data: { name: "Manager",       level: 3 } }),
    db.position.create({ data: { name: "Employee",      level: 1 } }),
  ]);

  console.log("✓ Department + positions created");

  // 5. Seed users
  const USERS = [
    {
      email:       "development.v001@gmail.com",
      password:    "test123456",
      code:        "ES0001",
      firstNameTh: "แอดมิน",
      lastNameTh:  "ระบบ",
      firstNameEn: "Admin",
      lastNameEn:  "User",
      roles:       ["ADMIN", "HRMG", "HR_AUTHORIZED"] as const,
      positionId:  posAdmin.id,
      label:       "Admin (HR Manager)",
    },
    {
      email:       "manager@gmail.com",
      password:    "test123456",
      code:        "ES0002",
      firstNameTh: "ผู้จัดการ",
      lastNameTh:  "ทดสอบ",
      firstNameEn: "Manager",
      lastNameEn:  "Test",
      roles:       ["MANAGER"] as const,
      positionId:  posManager.id,
      label:       "Manager",
    },
    {
      email:       "employee@gmail.com",
      password:    "test123456",
      code:        "ES0003",
      firstNameTh: "พนักงาน",
      lastNameTh:  "ทดสอบ",
      firstNameEn: "Employee",
      lastNameEn:  "Test",
      roles:       ["EMPLOYEE"] as const,
      positionId:  posEmployee.id,
      label:       "Employee",
    },
  ] as const;

  const hireDate = new Date("2024-01-01");

  for (const u of USERS) {
    const passwordHash = await hash(u.password);
    const cpUser = await cpDb.user.upsert({
      where: { email: u.email },
      create: {
        email:           u.email,
        emailVerified:   new Date(),
        passwordHash,
        mustChangePassword: false,
      },
      update: {},
      select: { id: true },
    });

    await db.employee.create({
      data: {
        userId:           cpUser.id,
        employeeCode:     u.code,
        firstNameTh:      u.firstNameTh,
        lastNameTh:       u.lastNameTh,
        firstNameEn:      u.firstNameEn,
        lastNameEn:       u.lastNameEn,
        roles:            [...u.roles],
        departmentId:     dept.id,
        positionId:       u.positionId,
        hireDate,
        employmentStatus: "ACTIVE",
        employmentType:   "MONTHLY",
        workShift:        "MORNING",
      },
    });

    console.log(`  ✓ ${u.label}: ${u.email} / ${u.password}`);
  }

  await db.$disconnect();
  await controlDb.$disconnect();
  await cpDb.$disconnect();
  console.log("\n✅ Done — easyslip tenant seeded");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
