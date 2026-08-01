-- D3.23 Platform Integrations & Library Sync — additive (no breaking drops).
-- Enum amendments: docs/10_INTEGRATIONS/* · S2_CLOSED_ENUM_GAP_REPORT §9.

ALTER TYPE "activity_kind" ADD VALUE IF NOT EXISTS 'library_synced';
ALTER TYPE "activity_kind" ADD VALUE IF NOT EXISTS 'achievement_synced';
ALTER TYPE "activity_kind" ADD VALUE IF NOT EXISTS 'playtime_updated';
ALTER TYPE "activity_kind" ADD VALUE IF NOT EXISTS 'integration_connected';
ALTER TYPE "activity_kind" ADD VALUE IF NOT EXISTS 'integration_disconnected';

DO $$ BEGIN
  CREATE TYPE "integration_provider" AS ENUM ('steam', 'xbox', 'playstation', 'epic', 'nintendo', 'csv');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "integration_sync_type" AS ENUM ('manual', 'daily', 'weekly', 'monthly', 'automatic');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "sync_job_status" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "sync_conflict_resolution" AS ENUM ('keep_local', 'keep_steam', 'newest_wins', 'ask_user');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "user_integrations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "integration_provider" NOT NULL,
    "external_ref" TEXT NOT NULL,
    "display_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "sync_type" "integration_sync_type" NOT NULL DEFAULT 'manual',
    "last_sync_at" TIMESTAMP(3),
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnected_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_integrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_integrations_user_id_provider_key" ON "user_integrations"("user_id", "provider");
CREATE INDEX IF NOT EXISTS "user_integrations_provider_status_idx" ON "user_integrations"("provider", "status");

CREATE TABLE IF NOT EXISTS "external_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "provider" "integration_provider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "vanity_url" TEXT,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "profile_url" TEXT,
    "raw" JSONB,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "external_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "external_profiles_integration_id_key" ON "external_profiles"("integration_id");
CREATE UNIQUE INDEX IF NOT EXISTS "external_profiles_provider_external_id_key" ON "external_profiles"("provider", "external_id");
CREATE INDEX IF NOT EXISTS "external_profiles_user_id_idx" ON "external_profiles"("user_id");

CREATE TABLE IF NOT EXISTS "external_games" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT,
    "provider" "integration_provider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "title" TEXT,
    "internal_game_id" TEXT,
    "mapping_confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "playtime_forever_min" INTEGER,
    "playtime_2_weeks_min" INTEGER,
    "last_played_at" TIMESTAMP(3),
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "external_games_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "external_games_provider_external_id_key" ON "external_games"("provider", "external_id");
CREATE INDEX IF NOT EXISTS "external_games_internal_game_id_idx" ON "external_games"("internal_game_id");
CREATE INDEX IF NOT EXISTS "external_games_integration_id_idx" ON "external_games"("integration_id");

CREATE TABLE IF NOT EXISTS "external_achievements" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "provider" "integration_provider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "internal_achievement_id" TEXT,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlocked_at" TIMESTAMP(3),
    "progress_current" INTEGER,
    "progress_target" INTEGER,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "external_achievements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "external_achievements_integration_id_external_id_key" ON "external_achievements"("integration_id", "external_id");
CREATE INDEX IF NOT EXISTS "external_achievements_internal_achievement_id_idx" ON "external_achievements"("internal_achievement_id");

CREATE TABLE IF NOT EXISTS "sync_jobs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "integration_id" TEXT,
    "provider" "integration_provider" NOT NULL,
    "sync_type" "integration_sync_type" NOT NULL,
    "status" "sync_job_status" NOT NULL DEFAULT 'pending',
    "error_code" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "bull_job_id" TEXT,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "sync_jobs_user_id_created_at_idx" ON "sync_jobs"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "sync_jobs_status_idx" ON "sync_jobs"("status");

CREATE TABLE IF NOT EXISTS "sync_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "integration_id" TEXT,
    "sync_job_id" TEXT NOT NULL,
    "provider" "integration_provider" NOT NULL,
    "sync_type" "integration_sync_type" NOT NULL,
    "status" "sync_job_status" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "imported_count" INTEGER NOT NULL DEFAULT 0,
    "updated_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "warning_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sync_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sync_history_sync_job_id_key" ON "sync_history"("sync_job_id");
CREATE INDEX IF NOT EXISTS "sync_history_user_id_started_at_idx" ON "sync_history"("user_id", "started_at");

CREATE TABLE IF NOT EXISTS "sync_conflicts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "integration_id" TEXT,
    "sync_job_id" TEXT,
    "external_game_id" TEXT,
    "internal_game_id" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'conflict',
    "resolution" "sync_conflict_resolution",
    "resolved_at" TIMESTAMP(3),
    "local_snapshot" JSONB,
    "remote_snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sync_conflicts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "sync_conflicts_user_id_resolved_at_idx" ON "sync_conflicts"("user_id", "resolved_at");
CREATE INDEX IF NOT EXISTS "sync_conflicts_sync_job_id_idx" ON "sync_conflicts"("sync_job_id");

DO $$ BEGIN
  ALTER TABLE "user_integrations" ADD CONSTRAINT "user_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "external_profiles" ADD CONSTRAINT "external_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "external_profiles" ADD CONSTRAINT "external_profiles_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "user_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "external_games" ADD CONSTRAINT "external_games_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "user_integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "external_games" ADD CONSTRAINT "external_games_internal_game_id_fkey" FOREIGN KEY ("internal_game_id") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "external_achievements" ADD CONSTRAINT "external_achievements_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "user_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "external_achievements" ADD CONSTRAINT "external_achievements_internal_achievement_id_fkey" FOREIGN KEY ("internal_achievement_id") REFERENCES "achievements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "user_integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "sync_history" ADD CONSTRAINT "sync_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "sync_history" ADD CONSTRAINT "sync_history_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "user_integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "sync_history" ADD CONSTRAINT "sync_history_sync_job_id_fkey" FOREIGN KEY ("sync_job_id") REFERENCES "sync_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "sync_conflicts" ADD CONSTRAINT "sync_conflicts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "sync_conflicts" ADD CONSTRAINT "sync_conflicts_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "user_integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "sync_conflicts" ADD CONSTRAINT "sync_conflicts_sync_job_id_fkey" FOREIGN KEY ("sync_job_id") REFERENCES "sync_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
