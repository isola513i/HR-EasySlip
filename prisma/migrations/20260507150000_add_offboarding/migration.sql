-- CreateEnum
CREATE TYPE "OffboardingReason" AS ENUM ('RESIGNATION', 'TERMINATION', 'RETIREMENT', 'CONTRACT_END');

-- CreateEnum
CREATE TYPE "OffboardingStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "OffboardingChecklist" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "reason" "OffboardingReason" NOT NULL,
    "lastDay" TIMESTAMP(3) NOT NULL,
    "status" "OffboardingStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "items" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OffboardingChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OffboardingChecklist_employeeId_key" ON "OffboardingChecklist"("employeeId");

-- CreateIndex
CREATE INDEX "OffboardingChecklist_status_idx" ON "OffboardingChecklist"("status");

-- AddForeignKey
ALTER TABLE "OffboardingChecklist" ADD CONSTRAINT "OffboardingChecklist_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
