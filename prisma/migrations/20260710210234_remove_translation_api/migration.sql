-- Remove the auto-translation API feature: drop the encrypted-key provider config table
-- and the machine-draft/source-hash tracking columns on SiteContent. The i18n structure,
-- language switching, and existing SiteContent.value translations are all preserved.

-- DropTable
DROP TABLE "TranslationConfig";

-- AlterTable
ALTER TABLE "SiteContent" DROP COLUMN "machineDraft",
DROP COLUMN "sourceHash";
