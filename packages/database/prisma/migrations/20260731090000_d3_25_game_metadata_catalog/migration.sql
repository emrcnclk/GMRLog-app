-- D3.25 Game Metadata & Catalog Foundation — ADDITIVE ONLY.
-- Authority: docs/18_CATALOG/GAME_METADATA_ARCHITECTURE.md
--            docs/18_CATALOG/D3_25_IMPLEMENTATION_PLAN.md (WP2)
--
-- Invariants for this file:
--   * no DROP TABLE / DROP COLUMN / DROP TYPE
--   * no NOT NULL column without a DEFAULT (existing rows must remain valid)
--   * every statement is idempotent (IF NOT EXISTS / duplicate_object guards)
--
-- Note: new `game_media_kind` values are added here but are NOT referenced by
-- any statement in this file — PostgreSQL forbids using a new enum value in the
-- transaction that adds it.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "metadata_provider" AS ENUM ('igdb', 'steam', 'rawg', 'manual');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "game_metadata_status" AS ENUM ('pending', 'enriching', 'complete', 'partial', 'failed', 'stale');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "company_role" AS ENUM ('developer', 'publisher', 'porting', 'supporting');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "game_related_kind" AS ENUM ('similar', 'dlc', 'expansion', 'remake', 'remaster', 'prequel', 'sequel');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "tag_kind" AS ENUM ('theme', 'mode', 'perspective', 'keyword');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "metadata_run_outcome" AS ENUM ('success', 'partial', 'no_match', 'skipped', 'error');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- GameMediaKind expansion (catalog media ingestion).
ALTER TYPE "game_media_kind" ADD VALUE IF NOT EXISTS 'hero';
ALTER TYPE "game_media_kind" ADD VALUE IF NOT EXISTS 'artwork';
ALTER TYPE "game_media_kind" ADD VALUE IF NOT EXISTS 'logo';
ALTER TYPE "game_media_kind" ADD VALUE IF NOT EXISTS 'trailer';

-- ---------------------------------------------------------------------------
-- New catalog tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "game_series" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_series_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "tag_kind" NOT NULL DEFAULT 'keyword',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "game_tags" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "game_companies" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "role" "company_role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_companies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "game_related_games" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "related_game_id" TEXT,
    "provider" "metadata_provider" NOT NULL,
    "related_external_id" TEXT NOT NULL,
    "related_title" TEXT,
    "kind" "game_related_kind" NOT NULL DEFAULT 'similar',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_related_games_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "game_metadata_runs" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "provider" "metadata_provider",
    "outcome" "metadata_run_outcome" NOT NULL,
    "reason" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "fields_written" INTEGER NOT NULL DEFAULT 0,
    "media_queued" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_metadata_runs_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- games — catalog metadata columns
-- ---------------------------------------------------------------------------

ALTER TABLE "games"
  ADD COLUMN IF NOT EXISTS "igdb_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "steam_app_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "rawg_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "summary" TEXT,
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "hero_key" TEXT,
  ADD COLUMN IF NOT EXISTS "trailer_url" TEXT,
  ADD COLUMN IF NOT EXISTS "external_rating" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "external_rating_count" INTEGER,
  ADD COLUMN IF NOT EXISTS "series_id" TEXT,
  ADD COLUMN IF NOT EXISTS "metadata_status" "game_metadata_status" NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "metadata_provider" "metadata_provider",
  ADD COLUMN IF NOT EXISTS "metadata_confidence" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "metadata_version" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "metadata_refreshed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "metadata_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "metadata_error" TEXT;

-- ---------------------------------------------------------------------------
-- game_media — ingestion provenance
-- ---------------------------------------------------------------------------

ALTER TABLE "game_media"
  ADD COLUMN IF NOT EXISTS "provider" "metadata_provider",
  ADD COLUMN IF NOT EXISTS "source_url" TEXT,
  ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "width" INTEGER,
  ADD COLUMN IF NOT EXISTS "height" INTEGER;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS "game_series_slug_key" ON "game_series"("slug");

CREATE UNIQUE INDEX IF NOT EXISTS "tags_slug_key" ON "tags"("slug");
CREATE INDEX IF NOT EXISTS "tags_kind_idx" ON "tags"("kind");

CREATE INDEX IF NOT EXISTS "game_tags_tag_id_idx" ON "game_tags"("tag_id");
CREATE UNIQUE INDEX IF NOT EXISTS "game_tags_game_id_tag_id_key" ON "game_tags"("game_id", "tag_id");

CREATE UNIQUE INDEX IF NOT EXISTS "companies_slug_key" ON "companies"("slug");

CREATE INDEX IF NOT EXISTS "game_companies_company_id_role_idx" ON "game_companies"("company_id", "role");
CREATE UNIQUE INDEX IF NOT EXISTS "game_companies_game_id_company_id_role_key" ON "game_companies"("game_id", "company_id", "role");

CREATE INDEX IF NOT EXISTS "game_related_games_game_id_kind_sort_order_idx" ON "game_related_games"("game_id", "kind", "sort_order");
CREATE INDEX IF NOT EXISTS "game_related_games_related_game_id_idx" ON "game_related_games"("related_game_id");
CREATE UNIQUE INDEX IF NOT EXISTS "game_related_games_game_id_provider_related_external_id_kin_key" ON "game_related_games"("game_id", "provider", "related_external_id", "kind");

CREATE INDEX IF NOT EXISTS "game_metadata_runs_game_id_created_at_idx" ON "game_metadata_runs"("game_id", "created_at");
CREATE INDEX IF NOT EXISTS "game_metadata_runs_outcome_created_at_idx" ON "game_metadata_runs"("outcome", "created_at");

CREATE INDEX IF NOT EXISTS "game_media_game_id_kind_sort_order_idx" ON "game_media"("game_id", "kind", "sort_order");
CREATE INDEX IF NOT EXISTS "game_media_provider_idx" ON "game_media"("provider");
CREATE UNIQUE INDEX IF NOT EXISTS "game_media_game_id_kind_source_url_key" ON "game_media"("game_id", "kind", "source_url");

CREATE UNIQUE INDEX IF NOT EXISTS "games_igdb_id_key" ON "games"("igdb_id");
CREATE UNIQUE INDEX IF NOT EXISTS "games_steam_app_id_key" ON "games"("steam_app_id");
CREATE UNIQUE INDEX IF NOT EXISTS "games_rawg_id_key" ON "games"("rawg_id");
CREATE INDEX IF NOT EXISTS "games_metadata_status_metadata_attempts_idx" ON "games"("metadata_status", "metadata_attempts");
CREATE INDEX IF NOT EXISTS "games_metadata_refreshed_at_idx" ON "games"("metadata_refreshed_at");
CREATE INDEX IF NOT EXISTS "games_series_id_idx" ON "games"("series_id");

-- ---------------------------------------------------------------------------
-- Foreign keys
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  ALTER TABLE "games" ADD CONSTRAINT "games_series_id_fkey"
    FOREIGN KEY ("series_id") REFERENCES "game_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "game_tags" ADD CONSTRAINT "game_tags_game_id_fkey"
    FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "game_tags" ADD CONSTRAINT "game_tags_tag_id_fkey"
    FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "game_companies" ADD CONSTRAINT "game_companies_game_id_fkey"
    FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "game_companies" ADD CONSTRAINT "game_companies_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "game_related_games" ADD CONSTRAINT "game_related_games_game_id_fkey"
    FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "game_related_games" ADD CONSTRAINT "game_related_games_related_game_id_fkey"
    FOREIGN KEY ("related_game_id") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "game_metadata_runs" ADD CONSTRAINT "game_metadata_runs_game_id_fkey"
    FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
