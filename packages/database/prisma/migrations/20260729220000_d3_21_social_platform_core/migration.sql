-- D3.21 Social Platform Core — additive schema (no breaking drops).
-- Enum amendments documented in docs/07_SOCIAL/* and S2_CLOSED_ENUM_GAP_REPORT.

ALTER TYPE "library_status" ADD VALUE IF NOT EXISTS 'dropped';

ALTER TYPE "comment_host_type" ADD VALUE IF NOT EXISTS 'collection';
ALTER TYPE "comment_host_type" ADD VALUE IF NOT EXISTS 'tier_list';

ALTER TYPE "reaction_target_type" ADD VALUE IF NOT EXISTS 'collection';
ALTER TYPE "reaction_target_type" ADD VALUE IF NOT EXISTS 'tier_list';

ALTER TYPE "activity_kind" ADD VALUE IF NOT EXISTS 'like';
ALTER TYPE "activity_kind" ADD VALUE IF NOT EXISTS 'comment';
ALTER TYPE "activity_kind" ADD VALUE IF NOT EXISTS 'wishlist';
ALTER TYPE "activity_kind" ADD VALUE IF NOT EXISTS 'profile_pin';
ALTER TYPE "activity_kind" ADD VALUE IF NOT EXISTS 'milestone';

DO $$ BEGIN
  CREATE TYPE "friend_request_status" AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "presence_status" AS ENUM ('online', 'away', 'offline', 'invisible');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "profile_pin_kind" AS ENUM ('game', 'review', 'collection');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "achievements" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'milestones';
ALTER TABLE "achievements" ADD COLUMN IF NOT EXISTS "is_hidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "achievements" ADD COLUMN IF NOT EXISTS "is_rare" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "achievements" ADD COLUMN IF NOT EXISTS "target" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "achievements_category_idx" ON "achievements"("category");

CREATE TABLE IF NOT EXISTS "friend_requests" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "status" "friend_request_status" NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    CONSTRAINT "friend_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "friendships" (
    "id" TEXT NOT NULL,
    "user_low_id" TEXT NOT NULL,
    "user_high_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_presence" (
    "user_id" TEXT NOT NULL,
    "status" "presence_status" NOT NULL DEFAULT 'offline',
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_presence_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE IF NOT EXISTS "user_archetypes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "archetype_key" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_archetypes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "profile_pins" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" "profile_pin_kind" NOT NULL,
    "object_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profile_pins_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "friend_requests_receiver_id_status_created_at_idx" ON "friend_requests"("receiver_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "friend_requests_sender_id_status_created_at_idx" ON "friend_requests"("sender_id", "status", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "friendships_user_low_id_user_high_id_key" ON "friendships"("user_low_id", "user_high_id");
CREATE INDEX IF NOT EXISTS "friendships_user_high_id_idx" ON "friendships"("user_high_id");
CREATE UNIQUE INDEX IF NOT EXISTS "user_archetypes_user_id_archetype_key_key" ON "user_archetypes"("user_id", "archetype_key");
CREATE INDEX IF NOT EXISTS "user_archetypes_archetype_key_idx" ON "user_archetypes"("archetype_key");
CREATE UNIQUE INDEX IF NOT EXISTS "profile_pins_user_id_kind_object_id_key" ON "profile_pins"("user_id", "kind", "object_id");
CREATE INDEX IF NOT EXISTS "profile_pins_user_id_position_idx" ON "profile_pins"("user_id", "position");

DO $$ BEGIN
  ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_low_id_fkey" FOREIGN KEY ("user_low_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_high_id_fkey" FOREIGN KEY ("user_high_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "user_presence" ADD CONSTRAINT "user_presence_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "user_archetypes" ADD CONSTRAINT "user_archetypes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "profile_pins" ADD CONSTRAINT "profile_pins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
