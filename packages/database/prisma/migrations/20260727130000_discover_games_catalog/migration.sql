-- S1.2 Discover Games amendment — catalog discovery fields on Game + GameGenre junction.

ALTER TABLE "games"
  ADD COLUMN "release_date" TIMESTAMP(3),
  ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "popularity" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "franchise_id" TEXT;

CREATE INDEX "games_featured_popularity_release_date_idx"
  ON "games" ("featured", "popularity", "release_date");

CREATE INDEX "games_franchise_id_idx" ON "games" ("franchise_id");

ALTER TABLE "games"
  ADD CONSTRAINT "games_franchise_id_fkey"
  FOREIGN KEY ("franchise_id") REFERENCES "franchises" ("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "game_genres" (
  "id" TEXT NOT NULL,
  "game_id" TEXT NOT NULL,
  "genre_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "game_genres_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "game_genres_game_id_genre_id_key" ON "game_genres" ("game_id", "genre_id");
CREATE INDEX "game_genres_genre_id_idx" ON "game_genres" ("genre_id");

ALTER TABLE "game_genres"
  ADD CONSTRAINT "game_genres_game_id_fkey"
  FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "game_genres"
  ADD CONSTRAINT "game_genres_genre_id_fkey"
  FOREIGN KEY ("genre_id") REFERENCES "genres" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
