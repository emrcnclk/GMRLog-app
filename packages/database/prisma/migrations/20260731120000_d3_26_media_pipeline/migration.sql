-- D3.26 Media Pipeline — ADDITIVE ONLY.
-- Authority: docs/18_CATALOG/MEDIA_INGESTION.md
--
-- Invariants for this file:
--   * no DROP TABLE / DROP COLUMN / DROP TYPE
--   * no NOT NULL column without a DEFAULT (existing rows must remain valid)
--   * every statement is idempotent (IF NOT EXISTS guards)
--
-- Adds BlurHash placeholders and responsive WebP-variant storage-key maps to
-- every image-bearing entity (Game cover/hero, GameMedia, User avatar/banner,
-- Community avatar/banner, PostMedia). All columns are nullable; existing
-- rows are populated lazily by the D3.26 media processing pipeline, never by
-- this migration.

-- ---------------------------------------------------------------------------
-- games.cover / games.hero
-- ---------------------------------------------------------------------------

ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "cover_blurhash" TEXT;
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "cover_variants" JSONB;
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "hero_blurhash" TEXT;
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "hero_variants" JSONB;

-- ---------------------------------------------------------------------------
-- game_media
-- ---------------------------------------------------------------------------

ALTER TABLE "game_media" ADD COLUMN IF NOT EXISTS "blurhash" TEXT;
ALTER TABLE "game_media" ADD COLUMN IF NOT EXISTS "variants" JSONB;

-- ---------------------------------------------------------------------------
-- users.avatar / users.banner
-- ---------------------------------------------------------------------------

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_blurhash" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_variants" JSONB;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banner_blurhash" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banner_variants" JSONB;

-- ---------------------------------------------------------------------------
-- communities.avatar / communities.banner
-- ---------------------------------------------------------------------------

ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "avatar_blurhash" TEXT;
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "avatar_variants" JSONB;
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "banner_blurhash" TEXT;
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "banner_variants" JSONB;

-- ---------------------------------------------------------------------------
-- post_media
-- ---------------------------------------------------------------------------

ALTER TABLE "post_media" ADD COLUMN IF NOT EXISTS "blurhash" TEXT;
ALTER TABLE "post_media" ADD COLUMN IF NOT EXISTS "variants" JSONB;
