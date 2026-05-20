-- DropForeignKey
ALTER TABLE "PlatformAuditLog" DROP CONSTRAINT "PlatformAuditLog_actorId_fkey";

-- AlterTable
ALTER TABLE "PlatformAuditLog" ALTER COLUMN "actorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "expiredAt" TIMESTAMP(3),
ADD COLUMN     "gracePeriodEndsAt" TIMESTAMP(3),
ADD COLUMN     "hardDeleteAt" TIMESTAMP(3),
ADD COLUMN     "lastExportRequestedAt" TIMESTAMP(3),
ADD COLUMN     "softDeleteAt" TIMESTAMP(3),
ADD COLUMN     "softDeletedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "PlatformAuditLog" ADD CONSTRAINT "PlatformAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "PlatformUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
