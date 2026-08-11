-- 5.2 (BACKEND_CHANGES.md §2): persist the similarity breakdown components
-- alongside the existing total score, so a later read path never has to
-- recompute them.
ALTER TABLE "user_similarity" ADD COLUMN "library" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "user_similarity" ADD COLUMN "genre" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "user_similarity" ADD COLUMN "review_rating" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "user_similarity" ADD COLUMN "wishlist" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "user_similarity" ADD COLUMN "completion" DOUBLE PRECISION NOT NULL DEFAULT 0;
