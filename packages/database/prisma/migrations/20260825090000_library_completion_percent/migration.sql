-- 13.1 — per-entry completion figure on a library entry.
--
-- Both columns are nullable and neither has a default: "not said" has to stay
-- distinguishable from "said zero". A DEFAULT 0 here would have every existing
-- row claim it got nowhere, which is a worse falsehood than the missing field
-- this replaces.
CREATE TYPE "completion_source" AS ENUM ('self_reported', 'imported');

ALTER TABLE "library_entries"
  ADD COLUMN "completion_percent" INTEGER,
  ADD COLUMN "completion_source" "completion_source";

-- The range is enforced here as well as in the validator. The validator guards
-- the one route a player can reach; this guards every writer, including the
-- achievement import that will write `imported` values without going through
-- it.
ALTER TABLE "library_entries"
  ADD CONSTRAINT "library_entries_completion_percent_range"
  CHECK ("completion_percent" IS NULL OR ("completion_percent" >= 0 AND "completion_percent" <= 100));
