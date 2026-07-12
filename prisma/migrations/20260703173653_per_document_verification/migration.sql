-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "supersededAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Document_userId_type_idx" ON "Document"("userId", "type");
