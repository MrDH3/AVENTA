-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED', 'RESUBMISSION');

-- AlterTable
ALTER TABLE "ClientProfile" ADD COLUMN     "sumsubApplicantId" TEXT,
ADD COLUMN     "verificationReason" TEXT,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SumsubConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "levelName" TEXT NOT NULL DEFAULT '',
    "secrets" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SumsubConfig_pkey" PRIMARY KEY ("id")
);
