-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "sumsubImageId" TEXT;

-- CreateIndex
CREATE INDEX "Document_sumsubImageId_idx" ON "Document"("sumsubImageId");
