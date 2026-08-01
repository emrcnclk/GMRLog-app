CREATE TABLE IF NOT EXISTS "game_genres" (
  "id" TEXT NOT NULL,
  "game_id" TEXT NOT NULL,
  "genre_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "game_genres_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "game_genres_game_id_genre_id_key" ON "game_genres" ("game_id", "genre_id");
CREATE INDEX IF NOT EXISTS "game_genres_genre_id_idx" ON "game_genres" ("genre_id");
DO $$ BEGIN
  ALTER TABLE "game_genres" ADD CONSTRAINT "game_genres_game_id_fkey"
    FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "game_genres" ADD CONSTRAINT "game_genres_genre_id_fkey"
    FOREIGN KEY ("genre_id") REFERENCES "genres" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
