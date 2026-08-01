-- D3.24 Social Feed, Communities & Events — additive (no breaking drops).
-- Authority: docs/07_SOCIAL/* · S2 closed enum gap amendment.

-- ContentVisibility.community
ALTER TYPE "content_visibility" ADD VALUE IF NOT EXISTS 'community';

-- CommunityRole.admin
ALTER TYPE "community_role" ADD VALUE IF NOT EXISTS 'admin';

-- CommunityJoinType
DO $$ BEGIN
  CREATE TYPE "community_join_type" AS ENUM ('public', 'private', 'invite_only');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- EventKind expansions
ALTER TYPE "event_kind" ADD VALUE IF NOT EXISTS 'lan';
ALTER TYPE "event_kind" ADD VALUE IF NOT EXISTS 'watch_party';
ALTER TYPE "event_kind" ADD VALUE IF NOT EXISTS 'coop_session';
ALTER TYPE "event_kind" ADD VALUE IF NOT EXISTS 'raid';
ALTER TYPE "event_kind" ADD VALUE IF NOT EXISTS 'release_countdown';
ALTER TYPE "event_kind" ADD VALUE IF NOT EXISTS 'release';
ALTER TYPE "event_kind" ADD VALUE IF NOT EXISTS 'community_night';
ALTER TYPE "event_kind" ADD VALUE IF NOT EXISTS 'speedrun';

-- EventParticipationState LFG
ALTER TYPE "event_participation_state" ADD VALUE IF NOT EXISTS 'looking_for_team';
ALTER TYPE "event_participation_state" ADD VALUE IF NOT EXISTS 'need_players';
ALTER TYPE "event_participation_state" ADD VALUE IF NOT EXISTS 'hosting';

DO $$ BEGIN
  CREATE TYPE "quote_target_type" AS ENUM ('post', 'review', 'collection', 'guide', 'achievement', 'screenshot', 'tier_list');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "post_kind" AS ENUM ('text', 'screenshot', 'video', 'poll', 'guide', 'news', 'quote');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "feed_item_kind" AS ENUM ('post_item', 'activity_item', 'recommendation_item', 'advertisement_item');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "reputation_badge" AS ENUM ('helpful_reviewer', 'strategy_expert', 'lore_master', 'achievement_hunter', 'community_leader');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "community_badge_kind" AS ENUM ('founder', 'moderator', 'top_contributor', 'verified_creator');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Users: creator_featured
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "creator_featured" BOOLEAN NOT NULL DEFAULT false;

-- Posts additives
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "post_kind" "post_kind" NOT NULL DEFAULT 'text';
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "contains_spoilers" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "pinned_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "posts_author_id_pinned_at_idx" ON "posts"("author_id", "pinned_at");

-- Communities additives
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "join_type" "community_join_type" NOT NULL DEFAULT 'public';
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Events description
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "description" TEXT;

CREATE TABLE IF NOT EXISTS "post_media" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "upload_key" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'image',
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "post_media_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "post_media_post_id_position_idx" ON "post_media"("post_id", "position");

CREATE TABLE IF NOT EXISTS "post_bookmarks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "post_bookmarks_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "post_bookmarks_user_id_post_id_key" ON "post_bookmarks"("user_id", "post_id");
CREATE INDEX IF NOT EXISTS "post_bookmarks_user_id_created_at_idx" ON "post_bookmarks"("user_id", "created_at");

CREATE TABLE IF NOT EXISTS "reposts" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "original_post_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "reposts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "reposts_actor_id_original_post_id_key" ON "reposts"("actor_id", "original_post_id");
CREATE INDEX IF NOT EXISTS "reposts_original_post_id_idx" ON "reposts"("original_post_id");

CREATE TABLE IF NOT EXISTS "quotes" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "target_type" "quote_target_type" NOT NULL,
    "target_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "visibility" "content_visibility" NOT NULL DEFAULT 'public',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "quotes_author_id_created_at_idx" ON "quotes"("author_id", "created_at");
CREATE INDEX IF NOT EXISTS "quotes_target_type_target_id_idx" ON "quotes"("target_type", "target_id");

CREATE TABLE IF NOT EXISTS "polls" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "polls_post_id_key" ON "polls"("post_id");

CREATE TABLE IF NOT EXISTS "poll_votes" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "option_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "poll_votes_poll_id_user_id_key" ON "poll_votes"("poll_id", "user_id");
CREATE INDEX IF NOT EXISTS "poll_votes_user_id_idx" ON "poll_votes"("user_id");

CREATE TABLE IF NOT EXISTS "mutes" (
    "id" TEXT NOT NULL,
    "muter_id" TEXT NOT NULL,
    "muted_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mutes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "mutes_muter_id_muted_id_key" ON "mutes"("muter_id", "muted_id");
CREATE INDEX IF NOT EXISTS "mutes_muted_id_idx" ON "mutes"("muted_id");

CREATE TABLE IF NOT EXISTS "user_reputations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge" "reputation_badge" NOT NULL,
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidence" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_reputations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_reputations_user_id_badge_key" ON "user_reputations"("user_id", "badge");
CREATE INDEX IF NOT EXISTS "user_reputations_badge_idx" ON "user_reputations"("badge");

CREATE TABLE IF NOT EXISTS "community_wiki_pages" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updated_by_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "community_wiki_pages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "community_wiki_pages_community_id_slug_key" ON "community_wiki_pages"("community_id", "slug");
CREATE INDEX IF NOT EXISTS "community_wiki_pages_community_id_idx" ON "community_wiki_pages"("community_id");

CREATE TABLE IF NOT EXISTS "community_pins" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "object_type" TEXT NOT NULL,
    "object_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "community_pins_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "community_pins_community_id_object_type_object_id_key" ON "community_pins"("community_id", "object_type", "object_id");
CREATE INDEX IF NOT EXISTS "community_pins_community_id_position_idx" ON "community_pins"("community_id", "position");

CREATE TABLE IF NOT EXISTS "community_member_badges" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "kind" "community_badge_kind" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "community_member_badges_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "community_member_badges_member_id_kind_key" ON "community_member_badges"("member_id", "kind");
CREATE INDEX IF NOT EXISTS "community_member_badges_community_id_idx" ON "community_member_badges"("community_id");

CREATE TABLE IF NOT EXISTS "event_invites" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "inviter_id" TEXT NOT NULL,
    "invitee_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "event_invites_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "event_invites_event_id_invitee_id_key" ON "event_invites"("event_id", "invitee_id");
CREATE INDEX IF NOT EXISTS "event_invites_invitee_id_idx" ON "event_invites"("invitee_id");

-- FKs (IF NOT EXISTS via DO blocks where needed)
DO $$ BEGIN
  ALTER TABLE "post_media" ADD CONSTRAINT "post_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "post_bookmarks" ADD CONSTRAINT "post_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "post_bookmarks" ADD CONSTRAINT "post_bookmarks_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "reposts" ADD CONSTRAINT "reposts_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "reposts" ADD CONSTRAINT "reposts_original_post_id_fkey" FOREIGN KEY ("original_post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "quotes" ADD CONSTRAINT "quotes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "polls" ADD CONSTRAINT "polls_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "mutes" ADD CONSTRAINT "mutes_muter_id_fkey" FOREIGN KEY ("muter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "mutes" ADD CONSTRAINT "mutes_muted_id_fkey" FOREIGN KEY ("muted_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "user_reputations" ADD CONSTRAINT "user_reputations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "community_wiki_pages" ADD CONSTRAINT "community_wiki_pages_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "community_wiki_pages" ADD CONSTRAINT "community_wiki_pages_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "community_pins" ADD CONSTRAINT "community_pins_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "community_member_badges" ADD CONSTRAINT "community_member_badges_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "community_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "community_member_badges" ADD CONSTRAINT "community_member_badges_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
