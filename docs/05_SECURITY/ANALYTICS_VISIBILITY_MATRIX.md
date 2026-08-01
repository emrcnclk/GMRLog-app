# Analytics Visibility Matrix

**Document:** `docs/05_SECURITY/ANALYTICS_VISIBILITY_MATRIX.md`  
**Status:** **Frozen — Analytics Platform Freeze v1.0** (Sprint 14.0)  
**Rule:** Aggregates over individuals; **PII never exposed** in Analytics APIs

---

## Principles

1. Analytics stores **telemetry & derived metrics**, not profiles.  
2. `properties` JSON: **IDs / enums / counts only**.  
3. Staff dashboards default to **aggregates**; user-level event streams are Admin-only and Phase 2.  
4. Insufficient role → **403**. Missing dashboard id → **404**. Do not leak existence of private entities via analytics errors.  
5. GDPR unlink supersedes “complete history” aesthetics.

---

## What may appear in `AnalyticsEvent.properties`

| Allowed | Forbidden |
|---------|-----------|
| `userId`, `actorId`, `gameId`, `reviewId`, `reportId`, `aggregateId` (UUIDs) | Email, username, displayName, phone |
| Enums (`status`, `entityType`, `action`) | Raw review/post/message bodies |
| Counts (`resultCount`, `strikeCount`) | Access/refresh tokens, session secrets |
| Booleans without PII | Raw IP, precise geo, device fingerprints as PII |
| | Password hashes, MFA secrets |

IP — if ever needed later — **hashed only** and only under Freeze amendment (V1: do not store).

---

## Audience visibility

| Data | ANON | USER | MODERATOR | ADMIN |
|------|------|------|-----------|-------|
| Platform KPI aggregates (`DailyMetric`) | — | — | ✅ | ✅ |
| Moderation volume series (counts) | — | — | ✅ | ✅ |
| Per-user event timeline | — | — | — | Phase 2 only |
| Raw properties dump | — | — | — | Phase 2 + rate limit |
| Search query strings from SearchEvent | — | — | via Search admin (deferred) | same — **not** via Analytics SoT |

---

## Deleted / banned users

| Case | Behavior |
|------|----------|
| Soft-deleted user | Exclude from uniqueness metrics when filter cheap; historical events may remain with `userId` until unlink job |
| Banned user | Still countable in T&S series; exclude from MALP/DAU **active belonging** proxies when flagged |
| GDPR deletion request | Set `userId` null on analytics rows; scrub any accidental PII fields; do not re-identify |

---

## Retention

| Class | Policy |
|-------|--------|
| `AnalyticsEvent` | Target **24 months** then purge/partition drop |
| `DailyMetric` | Retain longer as non-PII aggregates (product decision; default keep) |
| `RetentionMetric` | When written — cohort aggregates only |
| Cache | TTL only — not a retention store |

Align with [`DATA_RETENTION.md`](../13_ANALYTICS/DATA_RETENTION.md).

---

## GDPR unlink

1. Account deletion flow (Auth/Users) remains SoT for deletion request.  
2. Analytics worker (SYSTEM) unlinks `userId` on `AnalyticsEvent` / view facts if present.  
3. Do not block domain deletion on Analytics failures — retry job.  
4. Aggregates already rolled into `DailyMetric` stay (non-identifying).

---

## Staff visibility vs Admin Audit

| System | Purpose |
|--------|---------|
| Analytics | Product/ops KPIs |
| `AuditLog` (Admin read) | Who did privileged actions |

Analytics is **not** a substitute for AuditLog. Do not expose actor emails via Analytics.

---

## Related

- Freeze: [`ANALYTICS_PLATFORM_FREEZE_v1.md`](../00_PROJECT/ANALYTICS_PLATFORM_FREEZE_v1.md)  
- Permissions: [`ANALYTICS_PERMISSION_MATRIX.md`](./ANALYTICS_PERMISSION_MATRIX.md)
