-- D3.29 Backend Alignment — Profile Theme persistence — ADDITIVE ONLY.
-- Authority: docs/07_SOCIAL/PROFILE_CUSTOMIZATION.md "Backend follow-ups"
--
-- Invariants for this file:
--   * no DROP TABLE / DROP COLUMN / DROP TYPE
--   * no NOT NULL column without a DEFAULT (existing rows must remain valid)
--   * every statement is idempotent (IF NOT EXISTS / duplicate_object guards)
--
-- Promotes the device-local ProfileCustomization shape (previously AsyncStorage
-- only) to columns on user_settings, plus profile_visibility reusing the
-- existing content_visibility enum. All new columns are nullable or carry a
-- default matching the client's DEFAULT_CUSTOMIZATION, so every existing row
-- resolves to the same values the client already defaults to today.

DO $$ BEGIN
  CREATE TYPE "profile_accent" AS ENUM ('neutral', 'ember', 'plasma', 'toxic', 'cobalt', 'magma', 'orchid', 'gold');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "profile_card_style" AS ENUM ('elevated', 'flat', 'outlined');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "profile_banner_style" AS ENUM ('artwork', 'gradient', 'solid');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "console_generation" AS ENUM ('retro', 'gen6', 'gen7', 'gen8', 'gen9', 'pc', 'handheld');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ---------------------------------------------------------------------------
-- user_settings
-- ---------------------------------------------------------------------------

ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "profile_visibility" "content_visibility" NOT NULL DEFAULT 'public';
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "accent" "profile_accent" NOT NULL DEFAULT 'neutral';
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "card_style" "profile_card_style" NOT NULL DEFAULT 'elevated';
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "banner_style" "profile_banner_style" NOT NULL DEFAULT 'artwork';
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "favorite_platform" TEXT;
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "console_generation" "console_generation";
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "widget_order" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "pinned_widgets" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "hidden_widgets" TEXT[] NOT NULL DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- profile_pins — D3.29 Phase 2: badge equip/pin reuses the existing pin table.
-- ---------------------------------------------------------------------------

ALTER TYPE "profile_pin_kind" ADD VALUE IF NOT EXISTS 'achievement';
