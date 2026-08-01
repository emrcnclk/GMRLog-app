-- D3.18 — AuthCredential password binding (S2 AuthCredential · AUTHENTICATION.md)
-- Completes password identity storage omitted from initial catalog ("no secrets here").

ALTER TABLE "auth_credentials" ADD COLUMN IF NOT EXISTS "secret_hash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "auth_credentials_type_provider_ref_key"
  ON "auth_credentials" ("type", "provider_ref");
