# GMRLOG OS — Indexing Strategy

**Version:** 1.0.0  
**Document:** `docs/07_DATABASE/INDEXING_STRATEGY.md`  
**Status:** Approved  
**Owner:** Backend Team

---

## Purpose

Define the PostgreSQL indexing strategy for GMRLOG: B-tree indexes for relational access paths, GIN and trigram indexes for full-text search, partial indexes for filtered hot queries, and per-domain index catalogs aligned with [DATABASE_SPECIFICATION.md](DATABASE_SPECIFICATION.md) and [PRISMA_SCHEMA.md](PRISMA_SCHEMA.md).

Proper indexing targets read latency goals: simple reads <50ms, feed <150ms, search <200ms.

---

## Scope

| In scope | Out of scope |
|----------|--------------|
| Index types, naming, and column order | Query authoring in application code |
| Per-domain index tables | Elasticsearch migration (future) |
| Partial and composite indexes | Partition-level index attachment (see [PARTITIONING.md](PARTITIONING.md)) |
| FTS / trigram configuration | Materialized view definitions |

---

## Index Principles

1. **Every foreign key** has a supporting B-tree index (PostgreSQL does not auto-index FKs).
2. **Every soft-delete filter** (`deleted_at IS NULL`) on high-traffic tables uses partial indexes where beneficial.
3. **Composite index column order** matches equality filters first, then range/sort columns.
4. **Covering indexes** (INCLUDE) used sparingly for hot read-only queries.
5. **No redundant indexes** — review overlapping prefixes quarterly.
6. Large indexes created with `CREATE INDEX CONCURRENTLY` in migrations (see [DATABASE_MIGRATIONS.md](DATABASE_MIGRATIONS.md)).

---

## Index Types

| Type | PostgreSQL access method | GMRLOG use cases |
|------|--------------------------|------------------|
| B-tree (default) | `btree` | FK lookups, equality, range, `ORDER BY` on scalar columns |
| GIN | `gin` | `tsvector` FTS, `jsonb` containment, array overlap |
| GiST | `gist` | Trigram similarity (`pg_trgm`), geometric (future) |
| BRIN | `brin` | Append-only time-series on partitioned tables (v2) |
| Hash | `hash` | Not used — B-tree preferred for UUID equality |

### Extensions Required

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;  -- optional, search normalization
```

---

## Naming Convention

```
idx_{table}_{columns}[_{condition}]
```

Examples:

```text
idx_reviews_game_id_created_at
idx_users_username_active
idx_games_search_vector_gin
idx_reviews_title_trgm
```

- Lowercase snake_case.
- Column names in order of index definition.
- `_gin`, `_trgm`, `_brin` suffix for non-default access methods.
- Partial index: include key filter token, e.g. `_not_deleted`.

---

## B-Tree Indexes

### Universal Columns (all domain tables)

| Pattern | Columns | Notes |
|---------|---------|-------|
| Primary key | `id` | Automatic |
| Timestamps | `created_at` | List sorting, admin audits |
| FK outbound | `{foreign_key}_id` | Always index |

### Composite Column Ordering

For query:

```sql
WHERE game_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 20
```

Optimal index:

```sql
CREATE INDEX idx_reviews_game_id_created_at
  ON reviews (game_id, created_at DESC)
  WHERE deleted_at IS NULL;
```

Rule: `(equality columns…, sort column DESC/ASC)`.

---

## Full-Text Search (GIN + tsvector)

### Document Column Pattern

Generated `tsvector` column maintained by trigger or application write:

```sql
ALTER TABLE games ADD COLUMN search_vector tsvector;

CREATE INDEX idx_games_search_vector_gin ON games USING GIN (search_vector);
```

### Weighted Fields (games example)

| Field | Weight |
|-------|--------|
| `title` | A |
| `slug` | A |
| `summary` | B |
| `developer_names` | C |

Update on write:

```sql
search_vector :=
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(slug, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(summary, '')), 'B');
```

### FTS-Enabled Tables

| Table | Indexed fields | Config |
|-------|----------------|--------|
| `games` | title, slug, summary | `english` |
| `reviews` | title, body (plain text) | `english` |
| `posts` | body | `english` |
| `collections` | name, description | `english` |
| `tier_lists` | title, description | `english` |
| `developers` | name, slug | `english` |
| `studios` | name, slug | `english` |
| `users` | username, display_name | `simple` (usernames are not stemmed) |

Query pattern:

```sql
WHERE search_vector @@ plainto_tsquery('english', $1)
ORDER BY ts_rank(search_vector, plainto_tsquery('english', $1)) DESC
```

---

## Trigram Indexes (pg_trgm)

Used for **autocomplete** and fuzzy match where FTS ranking is too strict.

```sql
CREATE INDEX idx_games_title_trgm ON games USING GIN (title gin_trgm_ops);
CREATE INDEX idx_users_username_trgm ON users USING GIN (username gin_trgm_ops);
```

| Table | Column | Min query length |
|-------|--------|------------------|
| `games` | `title` | 2 chars |
| `users` | `username` | 2 chars |
| `developers` | `name` | 2 chars |
| `studios` | `name` | 2 chars |

Query:

```sql
WHERE title % $1 OR title ILIKE $1 || '%'
ORDER BY similarity(title, $1) DESC
LIMIT 10
```

Combine with `WHERE deleted_at IS NULL` via partial index when table has soft delete.

---

## Partial Indexes

Partial indexes reduce size and improve cache hit rate for queries that always filter the same way.

### Soft Delete Pattern

```sql
CREATE INDEX idx_reviews_user_id_created_at
  ON reviews (user_id, created_at DESC)
  WHERE deleted_at IS NULL;
```

### Visibility Pattern

```sql
CREATE INDEX idx_reviews_public_game
  ON reviews (game_id, created_at DESC)
  WHERE deleted_at IS NULL AND visibility = 'public';
```

### Notification Unread

```sql
CREATE INDEX idx_notifications_user_unread
  ON notifications (user_id, created_at DESC)
  WHERE read_at IS NULL AND archived_at IS NULL;
```

### Active Sessions

```sql
CREATE INDEX idx_play_sessions_user_active
  ON play_sessions (user_id, started_at DESC)
  WHERE ended_at IS NULL;
```

---

## Per-Domain Index Catalog

### Users Domain

| Index | Type | Columns | Partial / Notes |
|-------|------|---------|-----------------|
| `idx_users_pkey` | B-tree | `id` | PK |
| `idx_users_username` | B-tree | `username` | UNIQUE |
| `idx_users_email` | B-tree | `email` | UNIQUE |
| `idx_users_username_trgm` | GIN trigram | `username` | Autocomplete |
| `idx_users_created_at` | B-tree | `created_at` | Admin lists |
| `idx_users_not_deleted` | B-tree | `id` | `WHERE deleted_at IS NULL` |

### Games Domain

| Index | Type | Columns | Partial / Notes |
|-------|------|---------|-----------------|
| `idx_games_slug` | B-tree | `slug` | UNIQUE |
| `idx_games_studio_id` | B-tree | `studio_id` | FK |
| `idx_games_release_date` | B-tree | `release_date DESC` | Discover |
| `idx_games_search_vector_gin` | GIN | `search_vector` | FTS |
| `idx_games_title_trgm` | GIN trigram | `title` | Autocomplete |
| `idx_game_genres_genre_id` | B-tree | `genre_id, game_id` | Filter by genre |

### Reviews Domain

| Index | Type | Columns | Partial / Notes |
|-------|------|---------|-----------------|
| `idx_reviews_user_id_created_at` | B-tree | `user_id, created_at DESC` | `deleted_at IS NULL` |
| `idx_reviews_game_id_created_at` | B-tree | `game_id, created_at DESC` | `deleted_at IS NULL` |
| `idx_reviews_game_rating` | B-tree | `game_id, rating` | Aggregates |
| `idx_reviews_search_vector_gin` | GIN | `search_vector` | FTS |
| `idx_reviews_popularity` | B-tree | `like_count DESC, created_at DESC` | Trending |
| `idx_review_votes_review_user` | B-tree | `review_id, user_id` | UNIQUE vote |

### Game Logs Domain

| Index | Type | Columns | Partial / Notes |
|-------|------|---------|-----------------|
| `idx_game_logs_user_id_logged_at` | B-tree | `user_id, logged_at DESC` | Timeline |
| `idx_game_logs_game_id_logged_at` | B-tree | `game_id, logged_at DESC` | Game activity |
| `idx_play_sessions_user_id` | B-tree | `user_id, started_at DESC` | Sessions |
| `idx_game_progress_user_game` | B-tree | `user_id, game_id` | UNIQUE progress |

### Social / Feed Domain

| Index | Type | Columns | Partial / Notes |
|-------|------|---------|-----------------|
| `idx_follows_follower_following` | B-tree | `follower_id, following_id` | UNIQUE |
| `idx_follows_following_id` | B-tree | `following_id` | Reverse lookup |
| `idx_activity_feed_user_created` | B-tree | `user_id, created_at DESC` | Feed |
| `idx_posts_user_id_created_at` | B-tree | `user_id, created_at DESC` | `deleted_at IS NULL` |

### Messaging Domain

| Index | Type | Columns | Partial / Notes |
|-------|------|---------|-----------------|
| `idx_messages_conversation_created` | B-tree | `conversation_id, created_at DESC` | Chat history |
| `idx_conversation_members_user` | B-tree | `user_id, conversation_id` | Inbox |
| `idx_message_reads_message_user` | B-tree | `message_id, user_id` | Read receipts |

### Notifications Domain

| Index | Type | Columns | Partial / Notes |
|-------|------|---------|-----------------|
| `idx_notifications_user_unread` | B-tree | `user_id, created_at DESC` | Partial unread |
| `idx_notifications_user_created` | B-tree | `user_id, created_at DESC` | Full history |

### Collections / Tier Lists

| Index | Type | Columns | Partial / Notes |
|-------|------|---------|-----------------|
| `idx_collections_user_id` | B-tree | `user_id, created_at DESC` | `deleted_at IS NULL` |
| `idx_collection_games_collection` | B-tree | `collection_id, position` | Ordering |
| `idx_tier_lists_user_id` | B-tree | `user_id, created_at DESC` | |
| `idx_tier_items_tier_list_row` | B-tree | `tier_list_id, row_id, position` | |

---

## Unified Search Table (v1)

`search_documents` denormalized index for global search API:

| Index | Type | Columns |
|-------|------|---------|
| `idx_search_documents_entity` | B-tree | `entity_type, entity_id` | UNIQUE |
| `idx_search_documents_vector_gin` | GIN | `search_vector` |
| `idx_search_documents_popularity` | B-tree | `entity_type, popularity_score DESC` |

Updated asynchronously via [BACKGROUND_JOBS.md](../06_BACKEND/BACKGROUND_JOBS.md) `search.upsert` jobs.

---

## Index Maintenance

| Activity | Frequency |
|----------|-----------|
| `pg_stat_user_indexes` review (unused indexes) | Monthly |
| `REINDEX INDEX CONCURRENTLY` on bloat >30% | Quarterly or per alert |
| `ANALYZE` after large data migration | After each backfill |
| Autovacuum tuning on high-churn tables | Continuous monitoring |

### Monitoring

| Metric | Alert |
|--------|-------|
| Sequential scans on large tables | >1000/min on `reviews`, `game_logs` |
| Index hit rate | <95% on production |
| Index size vs table size | Trigram GIN >3× table → review necessity |

---

## Prisma Integration

Prisma schema declares indexes via `@@index`:

```prisma
model Review {
  @@index([gameId, createdAt(sort: Desc)], map: "idx_reviews_game_id_created_at")
  @@index([searchVector], type: Gin, map: "idx_reviews_search_vector_gin")
}
```

Partial indexes and `CONCURRENTLY` require raw SQL in migration files. Document in migration PR comment.

---

## Anti-Patterns

| Anti-pattern | Why avoid |
|--------------|-----------|
| Index every column | Write amplification, cache pollution |
| `(created_at, user_id)` when query filters `user_id` first | Poor selectivity ordering |
| Duplicate indexes on `(a)` and `(a, b)` without reason | Redundant — keep composite only |
| Trigram on full `body` text | Huge index — use FTS instead |
| Blocking `CREATE INDEX` on 10M+ rows | Production lock — use `CONCURRENTLY` |

---

## Acceptance Criteria

- [ ] Every FK column in [DATABASE_SPECIFICATION.md](DATABASE_SPECIFICATION.md) has a B-tree index.
- [ ] FTS-enabled tables have GIN `tsvector` indexes; autocomplete columns have trigram GIN.
- [ ] High-traffic soft-deleted tables use partial indexes with `deleted_at IS NULL`.
- [ ] Per-domain index tables in this document implemented in migrations.
- [ ] Large indexes created `CONCURRENTLY`; unused indexes reviewed monthly.

---

## Related Documents

- [DATABASE_SPECIFICATION.md](DATABASE_SPECIFICATION.md) — Table and domain definitions
- [PRISMA_SCHEMA.md](PRISMA_SCHEMA.md) — Prisma `@@index` declarations
- [DATABASE_MIGRATIONS.md](DATABASE_MIGRATIONS.md) — Concurrent index migration pattern
- [PARTITIONING.md](PARTITIONING.md) — BRIN and partition-local indexes
- [BACKGROUND_JOBS.md](../06_BACKEND/BACKGROUND_JOBS.md) — Search index jobs
- [SEARCH_API](../08_API/SEARCH_API.yaml) — Search query patterns

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-07-10 | Initial indexing strategy |
