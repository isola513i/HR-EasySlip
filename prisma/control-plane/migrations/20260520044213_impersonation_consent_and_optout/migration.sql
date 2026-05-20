-- CreateEnum
CREATE TYPE "ImpersonationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONSUMED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Plan" ALTER COLUMN "features" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "impersonationDisabledAt" TIMESTAMP(3),
ADD COLUMN     "impersonationDisabledBy" TEXT,
ADD COLUMN     "impersonationDisabledByEmail" TEXT,
ADD COLUMN     "impersonationEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ImpersonationRequest" (
    "id" TEXT NOT NULL,
    "platformUserId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expectedDurationMin" INTEGER NOT NULL DEFAULT 60,
    "status" "ImpersonationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approvalTokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "decidedAt" TIMESTAMP(3),
    "decidedByUserId" TEXT,
    "decidedByEmail" TEXT,
    "decisionNote" TEXT,
    "consumedAt" TIMESTAMP(3),
    "impersonationId" TEXT,

    CONSTRAINT "ImpersonationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImpersonationRequest_impersonationId_key" ON "ImpersonationRequest"("impersonationId");

-- CreateIndex
CREATE INDEX "ImpersonationRequest_tenantId_status_idx" ON "ImpersonationRequest"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ImpersonationRequest_approvalTokenHash_idx" ON "ImpersonationRequest"("approvalTokenHash");

-- AddForeignKey
ALTER TABLE "ImpersonationRequest" ADD CONSTRAINT "ImpersonationRequest_platformUserId_fkey" FOREIGN KEY ("platformUserId") REFERENCES "PlatformUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationRequest" ADD CONSTRAINT "ImpersonationRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationRequest" ADD CONSTRAINT "ImpersonationRequest_impersonationId_fkey" FOREIGN KEY ("impersonationId") REFERENCES "Impersonation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
