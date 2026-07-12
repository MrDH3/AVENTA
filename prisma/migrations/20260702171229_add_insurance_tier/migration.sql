-- CreateTable
CREATE TABLE "InsuranceTier" (
    "key" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "nameRu" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descRu" TEXT,
    "descEn" TEXT,
    "excessRu" TEXT,
    "excessEn" TEXT,
    "coverage" JSONB,
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceTier_pkey" PRIMARY KEY ("key")
);
