-- D3.22 Collections & Discovery Engine — additive schema (no breaking drops).
-- Enum amendments documented in docs/09_DISCOVERY/* and S2_CLOSED_ENUM_GAP_REPORT §8.

DO $$ BEGIN
  CREATE TYPE "collection_type" AS ENUM ('manual', 'dynamic', 'curated', 'official');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "wishlist_priority" AS ENUM ('low', 'medium', 'high', 'must_play');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "wishlist_wait_status" AS ENUM ('none', 'waiting_sale', 'waiting_dlc', 'waiting_translation', 'waiting_release');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "type" "collection_type" NOT NULL DEFAULT 'manual';
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "rule_key" TEXT;
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "banner_key" TEXT;
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "cover_key" TEXT;
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "color" TEXT;
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
CREATE INDEX IF NOT EXISTS "collections_type_idx" ON "collections"("type");

CREATE TABLE IF NOT EXISTS "discovery_scores" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "trending_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "popularity_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "review_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wishlist_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completion_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freshness_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discovery_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "discovery_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "discovery_scores_game_id_key" ON "discovery_scores"("game_id");
CREATE INDEX IF NOT EXISTS "discovery_scores_discovery_score_idx" ON "discovery_scores"("discovery_score");
CREATE INDEX IF NOT EXISTS "discovery_scores_trending_score_idx" ON "discovery_scores"("trending_score");

CREATE TABLE IF NOT EXISTS "game_similarity" (
    "id" TEXT NOT NULL,
    "game_a_id" TEXT NOT NULL,
    "game_b_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "game_similarity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "game_similarity_game_a_id_game_b_id_key" ON "game_similarity"("game_a_id", "game_b_id");
CREATE INDEX IF NOT EXISTS "game_similarity_game_a_id_score_idx" ON "game_similarity"("game_a_id", "score");
CREATE INDEX IF NOT EXISTS "game_similarity_game_b_id_score_idx" ON "game_similarity"("game_b_id", "score");

CREATE TABLE IF NOT EXISTS "user_similarity" (
    "id" TEXT NOT NULL,
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_similarity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_similarity_user_a_id_user_b_id_key" ON "user_similarity"("user_a_id", "user_b_id");
CREATE INDEX IF NOT EXISTS "user_similarity_user_a_id_score_idx" ON "user_similarity"("user_a_id", "score");
CREATE INDEX IF NOT EXISTS "user_similarity_user_b_id_score_idx" ON "user_similarity"("user_b_id", "score");

CREATE TABLE IF NOT EXISTS "collection_followers" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "collection_followers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "collection_followers_collection_id_user_id_key" ON "collection_followers"("collection_id", "user_id");
CREATE INDEX IF NOT EXISTS "collection_followers_user_id_idx" ON "collection_followers"("user_id");

CREATE TABLE IF NOT EXISTS "wishlist_metadata" (
    "id" TEXT NOT NULL,
    "library_entry_id" TEXT NOT NULL,
    "priority" "wishlist_priority" NOT NULL DEFAULT 'medium',
    "wait_status" "wishlist_wait_status" NOT NULL DEFAULT 'none',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "wishlist_metadata_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "wishlist_metadata_library_entry_id_key" ON "wishlist_metadata"("library_entry_id");

CREATE TABLE IF NOT EXISTS "recommendation_rules" (
    "id" TEXT NOT NULL,
    "seed_game_id" TEXT NOT NULL,
    "target_game_id" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "reason_key" TEXT NOT NULL DEFAULT 'because_you_played',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "recommendation_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "recommendation_rules_seed_game_id_target_game_id_key" ON "recommendation_rules"("seed_game_id", "target_game_id");
CREATE INDEX IF NOT EXISTS "recommendation_rules_seed_game_id_is_active_idx" ON "recommendation_rules"("seed_game_id", "is_active");

DO $$ BEGIN
  ALTER TABLE "discovery_scores" ADD CONSTRAINT "discovery_scores_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "game_similarity" ADD CONSTRAINT "game_similarity_game_a_id_fkey" FOREIGN KEY ("game_a_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "game_similarity" ADD CONSTRAINT "game_similarity_game_b_id_fkey" FOREIGN KEY ("game_b_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "user_similarity" ADD CONSTRAINT "user_similarity_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "user_similarity" ADD CONSTRAINT "user_similarity_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "collection_followers" ADD CONSTRAINT "collection_followers_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "collection_followers" ADD CONSTRAINT "collection_followers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "wishlist_metadata" ADD CONSTRAINT "wishlist_metadata_library_entry_id_fkey" FOREIGN KEY ("library_entry_id") REFERENCES "library_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "recommendation_rules" ADD CONSTRAINT "recommendation_rules_seed_game_id_fkey" FOREIGN KEY ("seed_game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "recommendation_rules" ADD CONSTRAINT "recommendation_rules_target_game_id_fkey" FOREIGN KEY ("target_game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
