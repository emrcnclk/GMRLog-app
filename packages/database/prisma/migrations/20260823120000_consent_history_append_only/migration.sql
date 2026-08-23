-- 12.4 follow-up — make `user_consents` append-only.
--
-- The table was keyed `(user_id, document_id, version)` UNIQUE, so recording a
-- second decision on the same version was an upsert that overwrote the first.
-- A player who accepted 1.0.0, withdrew, and accepted again left exactly one
-- row, saying `accepted`; the withdrawal in between — the period during which
-- processing had to stop — was gone. `user-consent.repository.ts`'s own
-- docstring already promised the opposite ("a withdrawal is recorded as a new
-- decision ... never as the removal of the acceptance that preceded it"), and
-- `LegalConsentStateResponse.decisions` is documented as "History, not just the
-- current state."
--
-- No data moves: every existing row is still the newest decision for its
-- version, which is exactly what the new read path returns for it.
--
-- `sequence` comes with the change rather than after it. Once more than one row
-- can exist per version, something has to say which is current, and
-- `decided_at` cannot: it is millisecond-precision, so a batch or a retry can
-- produce a tie, and a tie in an evidence table is the one thing this migration
-- exists to prevent. SERIAL backfills existing rows and orders every future
-- insert exactly.

ALTER TABLE "user_consents" ADD COLUMN "sequence" SERIAL;

DROP INDEX "user_consents_user_id_document_id_version_key";

CREATE INDEX "user_consents_user_id_document_id_version_sequence_idx"
    ON "user_consents" ("user_id", "document_id", "version", "sequence");
