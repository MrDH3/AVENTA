-- AlterTable
ALTER TABLE "User" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RecoveryEmail" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveryEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecoveryEmail_userId_idx" ON "RecoveryEmail"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryEmail_userId_email_key" ON "RecoveryEmail"("userId", "email");

-- AddForeignKey
ALTER TABLE "RecoveryEmail" ADD CONSTRAINT "RecoveryEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
