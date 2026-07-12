-- CreateTable
CREATE TABLE "ProviderCredential" (
    "provider" TEXT NOT NULL,
    "clientId" TEXT,
    "encryptedClientSecret" TEXT,
    "secretIv" TEXT,
    "secretAuthTag" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderCredential_pkey" PRIMARY KEY ("provider")
);
