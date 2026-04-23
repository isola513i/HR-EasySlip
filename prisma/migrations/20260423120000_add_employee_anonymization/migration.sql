-- PDPA Article 33: Right to Erasure — anonymization support
ALTER TABLE "Employee" ADD COLUMN "isAnonymized" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Employee" ADD COLUMN "anonymizedAt" TIMESTAMP(3);
