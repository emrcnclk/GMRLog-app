-- 12.6 — the right `privacy-policy.en.ts` promises: a 30-day grace period
-- between a deletion request and irreversible erasure, cancellable by the
-- player any time before `deletes_at`.
--
-- One row per user, reused across a request/cancel/request cycle rather than
-- kept as history — the account's current deletion state is a single fact.
-- `erased_at` makes the row idempotent once the login-time lazy sweep in
-- `AccountDeletionService` actually erases the account: a later login sees
-- `erased_at IS NOT NULL` and refuses rather than erasing twice.
--
-- No `ON DELETE CASCADE` complication to worry about on the `users` side of
-- this: erasure anonymises the `users` row in place rather than deleting it,
-- so this table's own `ON DELETE CASCADE` never actually fires in practice —
-- it exists for correctness, not because a `users` row is expected to be
-- removed.

CREATE TABLE "account_deletion_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletes_at" TIMESTAMP(3) NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "erased_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_deletion_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "account_deletion_requests_user_id_key"
    ON "account_deletion_requests"("user_id");

ALTER TABLE "account_deletion_requests"
    ADD CONSTRAINT "account_deletion_requests_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
