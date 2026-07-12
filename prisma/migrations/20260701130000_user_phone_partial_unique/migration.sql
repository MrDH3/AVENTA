-- Partial unique index on User.phone.
-- Enforces one account per phone number while PERMITTING MULTIPLE NULLs
-- (accounts that have no phone). Data is normalized + de-duplicated by
-- scripts/dedupe-phones.ts before this runs.
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_unique"
  ON "User" ("phone")
  WHERE "phone" IS NOT NULL;
