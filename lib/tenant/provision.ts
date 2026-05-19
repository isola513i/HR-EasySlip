import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
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
}): Promise<ProvisionResult> {
  const { databaseUrl, directUrl, adminEmail, adminName } = opts;

  try {
    const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
    const { stderr } = await execAsync(
      `bun prisma migrate deploy --schema="${schemaPath}"`,
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
    const existing = await client.user.findUnique({ where: { email: adminEmail } });
    if (existing) return { success: true };

    const tempPassword = generateTempPassword(12);
    const passwordHash = await hashPassword(tempPassword);

    const [firstName, ...rest] = adminName.trim().split(" ");
    const lastNameTh = rest.join(" ") || "-";

    await client.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        mustChangePassword: true,
        employee: {
          create: {
            employeeCode: "ADM001",
            firstNameTh: firstName,
            lastNameTh,
            hireDate: new Date(),
            employmentStatus: "ACTIVE",
            roles: ["TENANT_ADMIN"],
          },
        },
      },
    });

    return { success: true, tempPassword };
  } catch (err) {
    console.error("[provision] seed admin failed:", err);
    return { success: false, error: `Seed failed: ${(err as Error).message}` };
  } finally {
    await client.$disconnect();
  }
}
