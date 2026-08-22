-- 12.4c — the fields registration now asks for.
--
-- `birth_date`: a date, not an age. An age integer is wrong the next day and
-- cannot be re-checked. Its stated purpose is the age floor the Terms of
-- Service have claimed since 12.1 ("You must be at least 13") and which nothing
-- enforced until now.
--
-- `country_code`: ISO 3166-1 alpha-2, chosen by the player and never derived
-- from an IP address. The privacy policy states that GMRLog does not store IP
-- addresses, and that stays true. Purpose: which consumer law applies, which
-- age of consent applies, and where data may be held.
--
-- `first_name` / `last_name`: optional, and optional is the design. GMRLog is a
-- pseudonymous identity product — handle and display name are who you are here.
-- A real name is offered, never required, and is not identity verification: an
-- unverified name verifies nothing, it only collects.
--
-- All four are NULLABLE, including the two that registration requires. Accounts
-- that exist already have no true value for them, and a DEFAULT would fabricate
-- personal data — the same reason the consent table refused to backfill an
-- `accepted` row. NULL means "never asked", which is the truth. The register
-- schema makes it impossible for a new account to be in that state.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "first_name" TEXT,
  ADD COLUMN IF NOT EXISTS "last_name" TEXT,
  ADD COLUMN IF NOT EXISTS "birth_date" DATE,
  ADD COLUMN IF NOT EXISTS "country_code" CHAR(2);
