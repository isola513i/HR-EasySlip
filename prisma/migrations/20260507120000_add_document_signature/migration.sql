-- AlterTable
ALTER TABLE "Document" ADD COLUMN "requiresSignature" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DocumentSignature" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "signerEmployeeId" TEXT NOT NULL,
    "signatureDataUrl" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "DocumentSignature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSignature_documentId_signerEmployeeId_key" ON "DocumentSignature"("documentId", "signerEmployeeId");

-- CreateIndex
CREATE INDEX "DocumentSignature_signerEmployeeId_idx" ON "DocumentSignature"("signerEmployeeId");

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSignature" ADD CONSTRAINT "DocumentSignature_signerEmployeeId_fkey" FOREIGN KEY ("signerEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
