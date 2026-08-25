-- Bug 1 — ExternalGame uniqueness was global, not per-integration.
--
-- `UNIQUE(provider, external_id)` meant one row per game across the whole
-- product: Steam appid 620 is "620" for every player who owns Portal 2, so the
-- second player to sync did not get their own row — `upsert` matched the first
-- player's row and reassigned `integration_id` to the second player, silently
-- overwriting the first player's playtime and leaving them with nothing.
--
-- The replacement key `(integration_id, provider, external_id)` is strictly
-- WEAKER than the old one: any row set that satisfied the old constraint also
-- satisfies the new one, so this migration cannot fail on existing data and
-- needs no de-duplication or repair pass. Every surviving row keeps the owner
-- it currently has (the last integration to sync it), which is self-consistent
-- because its playtime came from that same sync. Players whose rows were taken
-- over simply have no row today; their next sync now creates one of their own
-- instead of stealing it back.
--
-- Note on NULLs: `integration_id` is nullable (the FK is ON DELETE SET NULL),
-- and Postgres treats NULLs as distinct in a unique index, so orphaned rows
-- left behind by a deleted integration are not de-duplicated by this key. That
-- is acceptable: every write path creates its sync job with a non-null
-- integration id (`csv-import.service.ts`, `integrations.service.ts`), so no
-- live sync ever writes a NULL, and orphans are already invisible to the app.

DROP INDEX IF EXISTS "external_games_provider_external_id_key";

CREATE UNIQUE INDEX IF NOT EXISTS "external_games_integration_id_provider_external_id_key"
  ON "external_games" ("integration_id", "provider", "external_id");
