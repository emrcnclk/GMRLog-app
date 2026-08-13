-- 5.4 (BACKEND_CHANGES.md §4): gate the DNA match panel on account type.
-- Required, single-valued, backfilled to 'individual' via the column default —
-- the same shape 3b.1e's community_kind migration used.

DO $$ BEGIN
  CREATE TYPE "account_kind" AS ENUM ('individual', 'organisation');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_kind" "account_kind" NOT NULL DEFAULT 'individual';
