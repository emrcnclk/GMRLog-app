# Migration Verification Policy — D2.1 Amendment

**Status:** ACTIVE · subordinate engineering policy
**Authority:** F6.5 Data Architecture · F6.9 Infrastructure & DevOps · S2 Database Specification
**Scope:** verification procedure only — this document does not change schema law, entity ownership, or migration content rules. S2 remains the single source of truth for the schema.

---

## 1. Why this amendment exists

D2.1 introduced two complementary ways of proving that Prisma migrations build the S2 schema on a completely empty database. They are **not interchangeable**: one is a fast development loop, the other is the release gate.

---

## 2. Development verification — PGlite (offline)

- **What:** every persistence test run (`pnpm --filter @gmrlog/database test`) constructs an in-process PGlite (WASM PostgreSQL) instance and applies the real `prisma/migrations/*` SQL scripts to it. Harness construction fails if `0_init` cannot build the schema on an empty database.
- **Where:** `packages/database/src/test-support/db-harness.ts` (default mode).
- **Guarantees:** migration SQL is syntactically and structurally valid PostgreSQL; tables, enums, FKs, unique constraints and cascade behaviour work; repository code round-trips against the schema.
- **Limits (why this is not enough for release):**
  - PGlite is single-connection WASM PostgreSQL — no real server process, no network stack, no connection pooling.
  - Migrations are applied as raw SQL, bypassing Prisma Migrate itself (`_prisma_migrations` bookkeeping, shadow-database drift detection and `migrate dev`/`migrate deploy` semantics are never exercised).
  - The WASM build may lag the server release line and does not exercise platform-specific behaviour (collations, extensions, on-disk layout).

## 3. Release verification — real PostgreSQL (mandatory)

- **What:** before any release (and after any migration change), the migration set MUST be verified against a real PostgreSQL 17 server:
  1. `prisma migrate dev` succeeds against a **completely empty** database (exercising Prisma Migrate, shadow database and drift detection),
  2. `prisma generate` succeeds,
  3. the full persistence test suite passes with `GMRLOG_TEST_DATABASE_URL` pointing at the real server (harness real-PostgreSQL mode).
- **How:**
  - **Canonical local development environment:** Docker infrastructure — `pnpm docker:up` starts `postgres:17` + `redis:7` (plus dev services) from `infrastructure/docker/docker-compose.yml`; then `pnpm db:validate:pg` with `GMRLOG_PG_VALIDATION_URL` pointing at it.
  - **Fallback (no Docker on the machine):** `pnpm db:validate:pg` boots the same PostgreSQL 17 major line via embedded native binaries (`embedded-postgres`) — a real `postgres` server process — and runs the identical three steps. This is a real-PostgreSQL validation, not an emulation; only the process supervisor differs from the Docker path.
- **Where:** `packages/database/scripts/validate-postgres.mjs`.

## 4. Rules

| Rule |
|------|
| PGlite verification runs on every test invocation — it never replaces release verification. |
| Real-PostgreSQL verification is **mandatory** before release and after any change under `prisma/migrations/`. |
| Both modes apply the **same** migration scripts and run the **same** test suite — verification environments never fork the schema. |
| CI environments with Docker MUST use the Docker path (environment parity, F6.9). |
| The initial `0_init` migration may be regenerated in place only while no environment beyond local development has applied it; after first deployment, migrations are append-only. |
