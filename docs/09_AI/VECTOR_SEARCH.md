# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/09_AI/VECTOR_SEARCH.md`

**Status:** Approved

**Owner:** Search & AI Team

**Classification:** Internal Engineering Documentation

---

# Vector Search

## Purpose

This document defines GMRLOG's semantic search pipeline: embedding generation, vector storage strategy, query flow, and the migration path to **pgvector** in PostgreSQL.

Vector search complements Meilisearch (`SEARCH_API.yaml`)—it does not replace deterministic full-text search.

---

## Search Modes Comparison

| Mode | Engine | Use case | API owner |
|------|--------|----------|-----------|
| Keyword / typo-tolerant | Meilisearch | Autocomplete, filters, browse | `SEARCH_API.yaml` |
| Natural language | LLM + embeddings | "cozy indie games like Stardew" | `AI_API.yaml` `POST /ai/search` |
| Similar entity | Vector KNN | Similar games, related reviews | `AI_API.yaml` recommendations |
| Hybrid (future) | Meilisearch + pgvector | Ranked discover feed | `SEARCH_API` + `AI_API` |

Rule from `API_ARCHITECTURE.md`: deterministic catalog search stays in `SEARCH_API`; semantic interpretation stays in `AI_API`.

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      Indexing Pipeline                       │
├─────────────────────────────────────────────────────────────┤
│  Domain event (game.updated, review.published, ...)          │
│       ↓                                                      │
│  BullMQ job: search.embed.{entity}                           │
│       ↓                                                      │
│  EmbeddingProvider (text-embedding-3-small, 1536 dims)       │
│       ↓                                                      │
│  Vector store write + metadata row in PostgreSQL             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       Query Pipeline                         │
├─────────────────────────────────────────────────────────────┤
│  POST /ai/search { query, filters?, limit? }               │
│       ↓                                                      │
│  Query embedding                                             │
│       ↓                                                      │
│  KNN search (top-K * 3 candidates)                           │
│       ↓                                                      │
│  Metadata filter (genre, platform, visibility)               │
│       ↓                                                      │
│  Reranker (cross-encoder or LLM lite) → top-K               │
│       ↓                                                      │
│  Hydrate from GAME_API / REVIEW_API schemas                  │
│       ↓                                                      │
│  AiNaturalLanguageSearchResponse                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Embedding Model

| Property | Value |
|----------|-------|
| Provider | OpenAI |
| Model | `text-embedding-3-small` |
| Dimensions | 1536 |
| Max input tokens | 8191 |
| Normalization | L2-normalized before storage |
| Version tag | `embed-v1` stored per vector |

Model upgrades require re-embedding all documents with new `embed-v2` tag and blue-green index swap.

---

## Indexed Entities (v1)

| Entity | Source text composition | Update trigger |
|--------|------------------------|----------------|
| `Game` | title + summary + genres + themes + developer names | `game.updated.v1` |
| `Review` | title + body (truncated 4K) + tags | `review.review.published.v1` |
| `Collection` | title + description | `collection.updated.v1` |
| `User` (public) | username + bio + favorite genres (no PII) | `user.profile.updated.v1` |
| `Post` | text content | `social.post.created.v1` |

Not indexed v1: messages, DMs, private drafts, admin content.

---

## Storage Strategy

### Phase 1 — Alpha / Beta (current target)

**Meilisearch** stores `_vectors` field (experimental) for games only.

- Fast iteration, no DB migration risk
- Limited to ~500K game vectors
- Cosine similarity via Meilisearch vector plugin

### Phase 2 — V1 (pgvector migration)

**PostgreSQL + pgvector extension** becomes the authoritative vector store.

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE search_embeddings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   TEXT NOT NULL,
  entity_id     UUID NOT NULL,
  embedding     vector(1536) NOT NULL,
  embed_version TEXT NOT NULL DEFAULT 'embed-v1',
  content_hash  TEXT NOT NULL,
  visibility    TEXT NOT NULL DEFAULT 'PUBLIC',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, embed_version)
);

CREATE INDEX idx_embeddings_hnsw ON search_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_embeddings_entity ON search_embeddings (entity_type, entity_id);
CREATE INDEX idx_embeddings_visibility ON search_embeddings (visibility);
```

#### Why pgvector

| Benefit | Detail |
|---------|--------|
| Transactional consistency | Embeddings commit with entity writes |
| Joins | Filter by game metadata in same query |
| Cost | No separate vector DB license |
| Ops | One backup/restore path with PostgreSQL |
| Hybrid queries | SQL pre-filter + vector KNN |

#### Migration steps

1. Enable `pgvector` on staging PostgreSQL.
2. Dual-write: Meilisearch vectors + `search_embeddings`.
3. Backfill job from catalog snapshot.
4. Shadow-read compare: recall@10 ≥ 0.92 vs Meilisearch.
5. Flip read path in `SemanticSearchService`.
6. Remove Meilisearch vectors; keep Meilisearch for keyword.

---

## Indexing Pipeline Detail

### Job: `search.embed.game`

```typescript
interface EmbedJobPayload {
  entityType: 'Game' | 'Review' | 'Collection' | 'User' | 'Post';
  entityId: string;
  force?: boolean;
}
```

Steps:

1. Fetch canonical text from domain service.
2. Compute `content_hash` (SHA-256 of normalized text).
3. Skip if hash matches existing row and `!force`.
4. Call `EmbeddingProvider.embed`.
5. Upsert `search_embeddings`.
6. If Phase 1: push to Meilisearch `_vectors`.

### Batch reindex

`POST` admin endpoint (future `ADMIN_API`) triggers `search.embed.batch` with cursor pagination. Rate limited to 100 entities/minute to protect embedding API budget.

---

## Query Pipeline Detail

### `POST /ai/search` (`aiSearch`)

**Request (`AiNaturalLanguageSearchRequest`):**

| Field | Description |
|-------|-------------|
| `query` | Natural language string (max 500 chars) |
| `entityTypes` | Filter: `GAME`, `REVIEW`, `COLLECTION`, `USER` |
| `filters` | Genre, platform, release year range |
| `limit` | Default 20, max 50 |

**Processing:**

1. **Intent parse** (lightweight): extract entity type bias from query.
2. **Embed query** — same model as documents.
3. **KNN** — `topK = limit * 3` for reranking headroom.
4. **Pre-filter** — SQL `WHERE` on visibility, blocked users, NSFW flags.
5. **Rerank** — cross-encoder or `gpt-4o-mini` scoring pass with candidate titles only (token budget cap).
6. **Hydrate** — batch fetch `GameSummary`, `ReviewSummary` from cache.
7. **Explain** (optional) — one-line "why matched" for UI transparency.

**Response (`AiNaturalLanguageSearchResponse`):**

```typescript
interface AiNaturalLanguageSearchResponse {
  items: AiSearchResultItem[];
  queryInterpretation: string;
  tookMs: number;
}
```

### Similar games (`GET /ai/recommendations/similar/{gameId}`)

Uses stored game embedding → KNN on `entity_type = 'Game'` excluding self and DLC duplicates.

---

## Hybrid Search (Future)

```sql
-- pgvector + full-text hybrid example
SELECT e.entity_id,
       (1 - (e.embedding <=> $1::vector)) AS vector_score,
       ts_rank(g.search_vector, plainto_tsquery($2)) AS text_score,
       (0.7 * (1 - (e.embedding <=> $1::vector)) + 0.3 * ts_rank(...)) AS combined
FROM search_embeddings e
JOIN games g ON g.id = e.entity_id
WHERE g.visibility = 'PUBLIC'
ORDER BY combined DESC
LIMIT 20;
```

Hybrid activates in V1.5 when pgvector migration completes.

---

## Caching

| Cache | Key | TTL |
|-------|-----|-----|
| Query embedding | `vec:q:{hash}` | 1h |
| KNN results | `vec:r:{hash}:{filters}` | 15m |
| Game embedding | `vec:e:game:{id}` | 24h (invalidated on update) |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Query embed | < 100ms p95 |
| KNN (pgvector HNSW) | < 50ms p95 @ 1M vectors |
| Full `/ai/search` | < 800ms p95 |
| Indexing lag (event → searchable) | < 60s p95 |

---

## Privacy and Safety

- Private / followers-only content: `visibility` column enforced at query time.
- Blocked user content excluded via join on `social_blocks`.
- Deleted entities: tombstone job removes embedding within 5 minutes.
- User embeddings exclude email, real name, connected accounts.

---

## Observability

| Metric | Description |
|--------|-------------|
| `vector_index_lag_seconds` | Event to indexed delay |
| `vector_search_recall_at_10` | Weekly eval vs golden set |
| `embedding_api_tokens` | Cost tracking |
| `vector_query_latency` | Histogram by entity type |

PostHog: `ai_search_executed`, `ai_search_zero_results`.

---

## Failure Modes

| Condition | Behavior |
|-----------|----------|
| Embedding API down | Fall back to Meilisearch keyword parse of query |
| pgvector unavailable | Read from Meilisearch vectors (Phase 1 path) |
| Zero results | Return empty + suggest keyword search link |
| Stale index | Results may miss <60s old content; acceptable |

---

## Package Structure

```text
apps/backend/src/search/
├── semantic-search.service.ts
├── embedding.provider.ts
├── vector-store/
│   ├── vector-store.interface.ts
│   ├── meilisearch-vector.store.ts   # Phase 1
│   └── pgvector.store.ts             # Phase 2
└── workers/
    └── embed.worker.ts
```

---

## Acceptance Criteria

- `POST /ai/search` returns hydrated results within latency targets.
- Embedding pipeline is idempotent on `content_hash`.
- pgvector migration path is documented with schema and indexes.
- Private content never appears in vector results.
- Meilisearch and vector concerns remain API-separated per `API_ARCHITECTURE.md`.

---

## Related Documents

- [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md)
- [SEARCH_API.yaml](../08_API/SEARCH_API.yaml)
- [AI_API.yaml](../08_API/AI_API.yaml)
- [DATABASE_SPECIFICATION.md](../07_DATABASE/DATABASE_SPECIFICATION.md)
- [EVENT_ARCHITECTURE.md](../06_BACKEND/EVENT_ARCHITECTURE.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 Alpha | 2026-07-10 | Initial release |
