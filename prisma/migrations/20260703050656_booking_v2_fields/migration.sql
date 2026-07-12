-- AlterEnum
ALTER TYPE "DocumentType" ADD VALUE 'SELFIE';

-- AlterTable
ALTER TABLE "ClientProfile" ADD COLUMN     "additionalPhone" TEXT,
ADD COLUMN     "additionalPhoneMessengers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "docCountry" TEXT,
ADD COLUMN     "docRegion" TEXT,
ADD COLUMN     "phoneMessengers" TEXT[] DEFAULT ARRAY[]::TEXT[];
