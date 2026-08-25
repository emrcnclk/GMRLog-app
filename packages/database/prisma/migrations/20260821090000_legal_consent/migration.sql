-- 12.4 — record what a player was shown and what they decided about it.
--
-- Before this table the app rendered "By continuing you agree to the Terms and
-- Privacy Policy" on both auth screens and kept no evidence that anyone had.
-- Under KVKK and the GDPR alike, proving consent is the controller's burden.
--
-- One row per (user, document, version). Keying on the version is the whole
-- design: accepting 1.0.0 says nothing about 1.1.0, and a table keyed only by
-- document would carry an old acceptance silently forward across a change to
-- the very rights it granted.
--
-- `decision` is an enum rather than a boolean deliberately. A `declined` row is
-- what makes "no dark patterns that re-enable after refusal" enforceable:
-- without it a refusal is indistinguishable from never having been asked, and
-- the only possible behaviour is to re-prompt on every launch until the player
-- gives in.
--
-- No backfill. Existing accounts registered before any consent was recorded,
-- and inventing an `accepted` row for them would fabricate exactly the evidence
-- this table exists to hold honestly. They are treated as not having decided,
-- which is the truth, and are asked on next launch.

CREATE TYPE "ConsentDecision" AS ENUM ('accepted', 'declined', 'withdrawn');

CREATE TABLE "user_consents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "consent_key" TEXT NOT NULL,
    "decision" "ConsentDecision" NOT NULL,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_consents_user_id_document_id_version_key"
    ON "user_consents"("user_id", "document_id", "version");

CREATE INDEX "user_consents_user_id_document_id_idx"
    ON "user_consents"("user_id", "document_id");

ALTER TABLE "user_consents"
    ADD CONSTRAINT "user_consents_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
