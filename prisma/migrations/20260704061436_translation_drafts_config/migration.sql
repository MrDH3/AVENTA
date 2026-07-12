-- AlterTable
ALTER TABLE "SiteContent" ADD COLUMN     "machineDraft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sourceHash" TEXT;

-- CreateTable
CREATE TABLE "TranslationConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "provider" TEXT NOT NULL DEFAULT 'deepl',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "secrets" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslationConfig_pkey" PRIMARY KEY ("id")
);
