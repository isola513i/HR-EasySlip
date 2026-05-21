import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaClient as CpPrismaClient } from "@/lib/db/generated/control-plane";
import { hashPassword, generateTempPassword } from "@/lib/auth/password-utils";

const execAsync = promisify(exec);

export interface ProvisionResult {
  success: boolean;
  tempPassword?: string;
  error?: string;
}

export async function provisionTenantDb(opts: {
  databaseUrl: string;
  directUrl: string | null;
  companyName: string;
  adminEmail: string;
  adminName: string;
  tenantId?: string;
}): Promise<ProvisionResult> {
  const { databaseUrl, directUrl, adminEmail, adminName, tenantId } = opts;

  try {
    const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
    const prismaBin = path.resolve(process.cwd(), "node_modules/.bin/prisma");
    const { stderr } = await execAsync(
      `"${prismaBin}" migrate deploy --schema="${schemaPath}"`,
      {
        env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: directUrl ?? databaseUrl },
        timeout: 120_000,
      }
    );
    if (stderr && !stderr.includes("All migrations have been successfully applied")) {
      console.warn("[provision] migrate stderr:", stderr);
    }
  } catch (err) {
    console.error("[provision] migrate deploy failed:", err);
    return { success: false, error: `Migration failed: ${(err as Error).message}` };
  }

  const client = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    const tempPassword = generateTempPassword(12);
    const passwordHash = await hashPassword(tempPassword);

    const [firstName, ...rest] = adminName.trim().split(" ");
    const lastNameTh = rest.join(" ") || "-";

    const cpUrl = process.env.CONTROL_PLANE_DATABASE_URL;
    let cpUserId: string | null = null;
    if (cpUrl) {
      const cp = new CpPrismaClient({ datasources: { db: { url: cpUrl } } });
      try {
        const existing = await cp.user.findUnique({
          where: { email: adminEmail },
          select: { id: true, passwordHash: true },
        });
        if (existing) {
          if (!existing.passwordHash) {
            await cp.user.update({
              where: { id: existing.id },
              data: { passwordHash, mustChangePassword: true, emailVerified: new Date() },
            });
          }
          cpUserId = existing.id;
        } else {
          const created = await cp.user.create({
            data: { email: adminEmail, emailVerified: new Date(), passwordHash, mustChangePassword: true },
            select: { id: true },
          });
          cpUserId = created.id;
        }
      } finally {
        await cp.$disconnect();
      }
    }

    // Check if employee already exists in tenant DB
    const existingEmp = cpUserId
      ? await client.employee.findFirst({ where: { userId: cpUserId }, select: { id: true } })
      : null;
    if (existingEmp) return { success: true };

    // Legacy: tenant DB still has a User table (from init migration) with a FK
    // Employee.userId → User.id. The User model was removed from schema.prisma
    // but the table + FK constraint remain. Mirror the CP user row here so the
    // FK is satisfied. Drop this once a migration removes the FK.
    const userId = cpUserId ?? adminEmail;
    await client.$executeRawUnsafe(
      `INSERT INTO "User" ("id", "email", "emailVerified", "updatedAt")
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT ("id") DO NOTHING`,
      userId,
      adminEmail,
    );

    const employee = await client.employee.create({
      data: {
        userId,
        employeeCode: "ADM001",
        firstNameTh: firstName,
        lastNameTh,
        hireDate: new Date(),
        employmentStatus: "ACTIVE",
        roles: ["TENANT_ADMIN"],
      },
      select: { id: true },
    });

    // Create TenantMembership in CP if we have the tenantId
    if (cpUserId && tenantId && cpUrl) {
      const cp = new CpPrismaClient({ datasources: { db: { url: cpUrl } } });
      try {
        await cp.tenantMembership.upsert({
          where: { userId_tenantId: { userId: cpUserId, tenantId } },
          create: { userId: cpUserId, tenantId, role: "TENANT_ADMIN", employeeRecordId: employee.id, status: "ACTIVE" },
          update: { employeeRecordId: employee.id },
        });
      } finally {
        await cp.$disconnect();
      }
    }

    return { success: true, tempPassword };
  } catch (err) {
    console.error("[provision] seed admin failed:", err);
    return { success: false, error: `Seed failed: ${(err as Error).message}` };
  } finally {
    await client.$disconnect();
  }
}
