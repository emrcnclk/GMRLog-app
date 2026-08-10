-- 3b.1e — design_handoff_dna_match_and_community/BACKEND_CHANGES.md §6.
-- Required, single-valued circle kind. Backfilled to 'games' via the column default.

DO $$ BEGIN
  CREATE TYPE "community_kind" AS ENUM ('games', 'board_games', 'cosplay', 'live_events');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "kind" "community_kind" NOT NULL DEFAULT 'games';
