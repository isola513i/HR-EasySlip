-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('USER', 'SYSTEM', 'PLATFORM_SUPPORT');

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "actorType" "AuditActorType" NOT NULL DEFAULT 'USER',
ADD COLUMN     "impersonationId" TEXT,
ADD COLUMN     "platformActorEmail" TEXT,
ADD COLUMN     "platformActorId" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_actorType_createdAt_idx" ON "AuditLog"("actorType", "createdAt");
