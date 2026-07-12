-- CreateTable
CREATE TABLE "BookingDraft" (
    "id" TEXT NOT NULL,
    "anonId" TEXT,
    "userId" TEXT,
    "carSlug" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "step" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingDraft_anonId_idx" ON "BookingDraft"("anonId");

-- CreateIndex
CREATE INDEX "BookingDraft_userId_idx" ON "BookingDraft"("userId");

-- AddForeignKey
ALTER TABLE "BookingDraft" ADD CONSTRAINT "BookingDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
