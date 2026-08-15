-- 9.5b (TASKS.md): stable, permanent per-account serial for the profile
-- card (§6's "№ 0042"). Must survive deletion of other accounts, so it is a
-- stored column assigned once — never a live COUNT/row-number recomputed on
-- read, which would renumber everyone behind a deleted row.
--
-- Every account consumes a number, individual and organisation alike: this
-- is account-creation order, not a DNA-match-adjacent concept, so there is
-- no reason to gate it by `account_kind` the way 5.4 gates the match panel.

CREATE SEQUENCE IF NOT EXISTS "users_card_number_seq";

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "card_number" INTEGER;

-- Deterministic backfill: creation order, ties broken by id, so a rerun
-- against unchanged data assigns the identical number to the identical row
-- every time.
UPDATE "users" AS u
SET "card_number" = ranked.rn
FROM (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "created_at" ASC, "id" ASC) AS rn
  FROM "users"
) AS ranked
WHERE u."id" = ranked."id" AND u."card_number" IS NULL;

-- Empty table (a fresh test database replaying every migration from
-- scratch): `is_called = false` so the *first* nextval() returns 1, rather
-- than passing setval a 0 it rejects (sequences MINVALUE is 1).
SELECT setval(
  '"users_card_number_seq"',
  GREATEST(COALESCE((SELECT MAX("card_number") FROM "users"), 1), 1),
  (SELECT COUNT(*) FROM "users") > 0
);

ALTER TABLE "users" ALTER COLUMN "card_number" SET DEFAULT nextval('"users_card_number_seq"');
ALTER TABLE "users" ALTER COLUMN "card_number" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "users_card_number_key" ON "users"("card_number");

ALTER SEQUENCE "users_card_number_seq" OWNED BY "users"."card_number";
