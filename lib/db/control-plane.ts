// Singleton Prisma client for the Control Plane DB.
//
// The generated client lives at lib/db/generated/control-plane and is
// produced by running:
//   bunx prisma generate --schema=prisma/control-plane/schema.prisma
//
// The import below will fail at build time if you haven't run that command yet.
// This is intentional — it surfaces the missing step clearly rather than
// silently falling back to an unexpected code path.

import { PrismaClient } from "@/lib/db/generated/control-plane";

let _client: PrismaClient | null = null;

export function getControlPlane(): PrismaClient {
  if (!process.env.CONTROL_PLANE_DATABASE_URL) {
    throw new Error(
      "CONTROL_PLANE_DATABASE_URL is not set. Run: bunx prisma migrate dev --schema=prisma/control-plane/schema.prisma"
    );
  }
  if (!_client) {
    _client = new PrismaClient({
      datasources: { db: { url: process.env.CONTROL_PLANE_DATABASE_URL } },
      log: ["warn", "error"],
    });
  }
  return _client;
}
