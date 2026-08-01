# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/09_AI/AI_ARCHITECTURE.md`

**Status:** Approved

**Owner:** AI Platform Team

**Classification:** Internal Engineering Documentation

---

# AI Architecture

## Purpose

This document defines the architecture of GMRLOG's AI capabilities: provider abstraction, service boundaries, API mapping to `AI_API.yaml`, quota enforcement, and observability.

AI features augment the gaming social experience—they do not replace deterministic product logic or become a hard dependency for core flows.

---

## Design Principles

1. **Provider agnostic** — Swap LLM/embedding providers without client changes.
2. **API-first** — All AI features surface through `AI_API.yaml`; clients never call providers directly.
3. **Graceful degradation** — Core app functions when AI is unavailable.
4. **Cost-aware** — Quotas, caching, and model routing minimize token spend.
5. **Safety by default** — Moderation runs on user-generated content paths before publish.
6. **Auditability** — Every AI request is logged with correlation ID; PII is redacted in logs.

---

## High-Level Architecture

```text
┌─────────────┐     ┌─────────────┐
│ Mobile App  │     │   Web App   │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 │  HTTPS /api/v1/ai/*
                 ▼
       ┌─────────────────────┐
       │   API Gateway       │
       │   Rate Limit + Auth │
       └──────────┬──────────┘
                  ▼
       ┌─────────────────────┐
       │  AI Service         │  NestJS module: apps/backend/src/ai/
       │  ┌───────────────┐  │
       │  │ AiController  │  │  ← maps to AI_API.yaml operations
       │  └───────┬───────┘  │
       │          ▼          │
       │  ┌───────────────┐  │
       │  │ AiOrchestrator│  │  routing, quotas, caching
       │  └───────┬───────┘  │
       │          ▼          │
       │  ┌───────────────┐  │
       │  │ Provider      │  │  abstraction layer
       │  │ Registry      │  │
       │  └───────┬───────┘  │
       └──────────┼──────────┘
                  │
     ┌────────────┼────────────┐
     ▼            ▼            ▼
 OpenAI      Anthropic     Local/Fallback
 (primary)   (secondary)   (dev + outage)
     │            │
     └────────────┴──► Embedding API
                       │
                       ▼
              PostgreSQL (metadata)
              Redis (response cache)
              BullMQ (async jobs)
```

---

## Service Boundaries

| Owns | Does not own |
|------|--------------|
| LLM inference orchestration | User profile storage (`USER_API`) |
| Embedding generation | Deterministic search (`SEARCH_API`) |
| Prompt template resolution | Content persistence (domain APIs) |
| Moderation scoring | Human moderation decisions (`ADMIN_API` — pending) |
| Usage metering | Payment/billing (future monetization) |
| Model catalog exposure | Game catalog metadata (`GAME_API`) |

Cross-module rule: AI returns suggestions and scores; domain services commit authoritative records.

---

## Provider Abstraction

### Interface

```typescript
// packages/types/src/ai/ai-provider.ts

interface AiProvider {
  readonly name: AiProviderName;
  complete(request: CompletionRequest): Promise<CompletionResponse>;
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  moderate?(request: ModerationRequest): Promise<ModerationResponse>;
  healthCheck(): Promise<ProviderHealth>;
}

type AiProviderName = 'openai' | 'anthropic' | 'local';
```

### Provider registry

```typescript
interface ProviderRegistry {
  getProvider(capability: AiCapability, tier: UserTier): AiProvider;
  getFallback(primary: AiProviderName): AiProvider | null;
}
```

### Routing rules

| Capability | Primary | Fallback | Local dev |
|------------|---------|----------|-----------|
| Chat completion | OpenAI `gpt-4o-mini` | Anthropic `claude-3-5-haiku` | Ollama |
| Review assist | OpenAI `gpt-4o-mini` | Anthropic haiku | Ollama |
| Embeddings | OpenAI `text-embedding-3-small` | — | Mock vectors |
| Moderation | OpenAI Moderation API | In-house classifier | Pass-through |
| Image analysis | OpenAI vision | — | Disabled |

Model IDs exposed to clients via `GET /ai/models` (`operationId: availableModels`).

---

## AI_API.yaml Mapping

Every `operationId` in `docs/08_API/AI_API.yaml` maps to a backend handler:

| Operation ID | Path | Handler module |
|--------------|------|----------------|
| `getRecommendations` | `GET /ai/recommendations` | `RecommendationService` |
| `nextGameRecommendation` | `GET /ai/recommendations/next` | `RecommendationService` |
| `similarGames` | `GET /ai/recommendations/similar/{gameId}` | `RecommendationService` |
| `summarizeReview` | `POST /ai/reviews/summarize` | `ReviewAiService` |
| `improveReview` | `POST /ai/reviews/improve` | `ReviewAiService` |
| `spellcheckReview` | `POST /ai/reviews/spellcheck` | `ReviewAiService` |
| `detectSpoilers` | `POST /ai/reviews/spoilers` | `ReviewAiService` |
| `analyzeSentiment` | `POST /ai/reviews/sentiment` | `ReviewAiService` |
| `detectToxicity` | `POST /ai/reviews/toxicity` | `ReviewAiService` |
| `suggestReviewTags` | `POST /ai/reviews/tags` | `ReviewAiService` |
| `aiSearch` | `POST /ai/search` | `SemanticSearchService` |
| `generateCollection` | `POST /ai/collections/generate` | `GenerationService` |
| `generateList` | `POST /ai/lists/generate` | `GenerationService` |
| `generateTierList` | `POST /ai/tierlists/generate` | `GenerationService` |
| `analyzeImage` | `POST /ai/images/analyze` | `VisionService` |
| `ocr` | `POST /ai/ocr` | `VisionService` |
| `translate` | `POST /ai/translate` | `TranslationService` |
| `aiChat` | `POST /ai/chat` | `ChatService` |
| `moderateContent` | `POST /ai/moderation` | `ModerationService` |
| `promptTemplates` | `GET /ai/prompts` | `PromptService` |
| `aiUsage` | `GET /ai/usage` | `UsageService` |
| `availableModels` | `GET /ai/models` | `ModelCatalogService` |
| `aiFeedback` | `POST /ai/feedback` | `FeedbackService` |
| `getUserInsights` | `GET /ai/users/{userId}/insights` | `InsightService` |
| `getProfileSummary` | `GET /ai/users/{userId}/profile-summary` | `InsightService` |
| `getGamingStyle` | `GET /ai/users/{userId}/gaming-style` | `InsightService` |

OpenAPI is the contract. Implementation must not add undocumented endpoints.

---

## Request Pipeline

```text
HTTP Request
  → Auth guard (JWT)
  → Quota guard (Redis counter)
  → Rate limiter (per-user + global)
  → Input validator (Zod / class-validator)
  → Prompt resolver (template + user context)
  → Provider call (with timeout)
  → Output validator (schema + moderation re-check)
  → Response cache write (if cacheable)
  → Usage ledger append
  → HTTP Response
```

### Timeouts

| Operation class | Timeout |
|-----------------|---------|
| Sync completion | 30s |
| Streaming chat | 120s (SSE) |
| Embedding batch | 15s |
| Moderation | 5s |
| Vision / OCR | 45s |

---

## Quotas and Rate Limits

### Tier limits (monthly token budget)

| Tier | Monthly tokens | Daily requests | Chat sessions/day |
|------|----------------|----------------|-------------------|
| Guest | 0 (AI disabled) | 0 | 0 |
| Free | 50,000 | 100 | 10 |
| Premium | 500,000 | 1,000 | 100 |
| Developer | 200,000 | 500 | 50 |
| Moderator | 100,000 | 200 | 20 |
| Admin | Unlimited | Unlimited | Unlimited |

Token counting uses provider-reported `usage.total_tokens`. Estimated pre-flight checks block requests that would exceed 110% of remaining budget.

### Endpoint-specific limits

| Endpoint group | Additional limit |
|----------------|------------------|
| `/ai/chat` | 20 messages per session, 4K context window |
| `/ai/images/analyze` | 10 MB image, 20/day free tier |
| `/ai/moderation` | Internal + moderator calls only for bulk |
| Generation endpoints | 5/hour free, 50/hour premium |

### Quota storage

```
Redis key: ai:usage:{userId}:{YYYY-MM}
Redis key: ai:daily:{userId}:{YYYY-MM-DD}
```

`GET /ai/usage` (`AiUsageResponse`) returns `period`, `totalRequests`, `totalTokens`, `remainingTokens`, `limits`.

Exceeded quota → `429` with `ProblemDetails` code `AI_QUOTA_EXCEEDED`.

---

## Caching

| Request type | Cache key | TTL |
|--------------|-----------|-----|
| Similar games | `ai:rec:similar:{gameId}:{model}` | 24h |
| Profile summary | `ai:insight:profile:{userId}` | 6h |
| Prompt templates | `ai:prompts:{category}` | 1h |
| Translation | `ai:translate:{hash}` | 7d |
| Embeddings | `ai:embed:{hash}` | 30d |

Cache invalidation on profile update, game metadata change, or model version bump.

User-initiated completions (review improve, chat) are never cached.

---

## Async Processing

Long-running jobs enqueued to BullMQ:

| Job | Queue | Trigger |
|-----|-------|---------|
| `ai.batch-embed` | `ai` | Catalog indexing |
| `ai.insight-refresh` | `ai` | Weekly cron per active user |
| `ai.moderation-backfill` | `moderation` | Admin batch scan |

Workers live in `apps/backend/src/ai/workers/`.

---

## Streaming

`POST /ai/chat` supports `Accept: text/event-stream`.

Events: `message.delta`, `message.done`, `error`.

Mobile uses SSE polyfill; web uses native `EventSource` with auth header via fetch stream.

---

## Security

- API keys stored in secrets manager—never in repo or client bundles.
- User content in prompts is escaped; system prompts are immutable server-side.
- `GET /ai/users/{userId}/*` enforces self-or-admin authorization.
- Moderation logs retain content hashes, not full text, after 90 days.
- All AI responses for UGC assist are marked `generated: true` in metadata.

---

## Observability

| Signal | Tool |
|--------|------|
| Latency p50/p95 | Prometheus histogram `ai_request_duration_seconds` |
| Token spend | Grafana dashboard per tier |
| Error rate | Sentry + alert > 2% |
| Provider health | Synthetic probe every 60s |
| Quality | `POST /ai/feedback` aggregation |

PostHog events: `ai_feature_used`, `ai_quota_exceeded`, `ai_provider_fallback`.

---

## Failure Modes

| Condition | Behavior |
|-----------|----------|
| Primary provider down | Automatic fallback provider |
| All providers down | `503 AI_SERVICE_UNAVAILABLE`; UI shows retry |
| Quota exceeded | `429` with upgrade CTA for premium features |
| Moderation timeout | Fail closed for publish paths; fail open for assist paths |
| Invalid model requested | `400` with available models list |

---

## Package Structure

```text
apps/backend/src/ai/
├── ai.module.ts
├── ai.controller.ts
├── services/
│   ├── ai-orchestrator.service.ts
│   ├── recommendation.service.ts
│   ├── review-ai.service.ts
│   ├── moderation.service.ts
│   ├── chat.service.ts
│   └── usage.service.ts
├── providers/
│   ├── openai.provider.ts
│   ├── anthropic.provider.ts
│   └── local.provider.ts
└── workers/

packages/types/src/ai/
├── ai-provider.ts
├── completion.ts
└── moderation.ts
```

---

## Acceptance Criteria

- All `AI_API.yaml` operations have a documented handler mapping.
- Provider swap requires config change only—no client release.
- Quotas enforce consistently across mobile and web.
- AI outage does not block login, feed, or messaging.

---

## Related Documents

- [AI_MODERATION.md](AI_MODERATION.md)
- [PROMPT_LIBRARY.md](PROMPT_LIBRARY.md)
- [VECTOR_SEARCH.md](VECTOR_SEARCH.md)
- [AI_API.yaml](../08_API/AI_API.yaml)
- [API_ARCHITECTURE.md](../08_API/API_ARCHITECTURE.md)
- [MONETIZATION.md](../14_MONETIZATION/MONETIZATION.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 Alpha | 2026-07-10 | Initial release |
