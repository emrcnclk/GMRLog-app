-- D4.1 — OAuth login providers (design_handoff_dna_match_and_community/OAUTH.md §1, TASKS.md 4.1).
-- Google and Discord are login providers ("oauth_provider"); Steam stays connection-only and
-- "connected_provider" (steam, discord) is untouched. "account_link_provider" is the superset
-- AccountLink needs, since it flows through login (google, discord) and connect/import (steam,
-- discord) alike.

DO $$ BEGIN
  CREATE TYPE "oauth_provider" AS ENUM ('google', 'discord');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "account_link_provider" AS ENUM ('google', 'steam', 'discord');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "auth_credentials" ADD COLUMN IF NOT EXISTS "provider" "oauth_provider";

ALTER TABLE "account_links"
  ALTER COLUMN "provider" TYPE "account_link_provider"
  USING ("provider"::text::"account_link_provider");
