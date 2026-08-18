-- Bug 2 — promote the verified/unverified distinction out of JSON metadata and
-- into a real column.
--
-- `POST /integrations/steam/connect` accepts a self-reported SteamID and does no
-- ownership check at all, so any player could attach a stranger's SteamID to
-- their own account. That endpoint is now refused outside development, and the
-- OpenID 2.0 callback (`POST /auth/connect/steam/callback`) is the only path
-- that can produce a verified connection.
--
-- Backfill is deliberately honest rather than blanket-false: connections made
-- through the OpenID path already carry `metadata->>'verified' = 'true'`, which
-- means Steam itself confirmed ownership via `check_authentication`. Forcing
-- those users to re-verify would cost them a round-trip and buy no security.
-- Every self-reported connection — the actually-untrusted set — takes the
-- column default of false and must re-connect through OpenID to regain it.

ALTER TABLE "user_integrations"
  ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT false;

UPDATE "user_integrations"
   SET "verified" = true
 WHERE "metadata" IS NOT NULL
   AND jsonb_typeof("metadata"::jsonb) = 'object'
   AND ("metadata"::jsonb ->> 'verified') = 'true';

CREATE INDEX IF NOT EXISTS "user_integrations_provider_verified_idx"
  ON "user_integrations" ("provider", "verified");
