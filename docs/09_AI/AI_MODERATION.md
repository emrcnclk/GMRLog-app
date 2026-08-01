# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/09_AI/AI_MODERATION.md`

**Status:** Approved

**Owner:** Trust & Safety Team

**Classification:** Internal Engineering Documentation

---

# AI Moderation

## Purpose

This document defines how GMRLOG detects, scores, and routes harmful user-generated content using AI-assisted moderation, rule engines, and human review queues.

Moderation protects community quality without suppressing legitimate gaming discourse (spoilers, critique, mature game themes).

---

## Scope

| Content types | Pipeline stage |
|---------------|----------------|
| Reviews and comments | Pre-publish + periodic rescan |
| Posts and quotes | Pre-publish |
| Messages (DM) | Post-send async scan |
| Usernames, bios, display names | On save |
| Collection / tier list titles | On publish |
| Images (avatars, posts) | Upload + async vision |
| AI chat output | Post-generation filter |

Out of scope: game catalog metadata (licensed sources), developer-verified announcements.

---

## Moderation Architecture

```text
User submits content
        │
        ▼
┌───────────────────┐
│  Rule Engine      │  regex, blocklists, velocity
│  (deterministic)  │
└─────────┬─────────┘
          │ pass
          ▼
┌───────────────────┐
│  AI Moderation    │  POST /ai/moderation
│  ModerationService│  + specialized endpoints
└─────────┬─────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
 AUTO_ALLOW  FLAG / BLOCK
    │           │
    │           ▼
    │    ┌──────────────────┐
    │    │ Human Review Queue │  apps/admin (pending ADMIN_API)
    │    └─────────┬──────────┘
    │              ▼
    │         MODERATOR ACTION
    ▼
 Published / Rejected / Edited
```

---

## API Contract

Primary endpoint: `POST /ai/moderation` (`operationId: moderateContent`).

### Request (`ModerationRequest`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | `string` | Yes | Content to evaluate |
| `entityType` | `enum` | No | `REVIEW`, `COMMENT`, `POST`, `MESSAGE`, `PROFILE`, `COLLECTION`, `TIERLIST` |
| `entityId` | `string` | No | For audit correlation |
| `locale` | `string` | No | BCP 47; improves multilingual detection |

### Response (`ModerationResult`)

| Field | Type | Description |
|-------|------|-------------|
| `flagged` | `boolean` | Whether action is required |
| `categories` | `string[]` | e.g. `HATE`, `HARASSMENT`, `SPAM`, `SEXUAL`, `VIOLENCE`, `SELF_HARM`, `SPOILER_ABUSE` |
| `scores` | `object` | Per-category confidence 0.0–1.0 |
| `recommendedAction` | `enum` | `ALLOW`, `SOFT_FLAG`, `HARD_FLAG`, `BLOCK`, `SHADOW_LIMIT` |
| `explanation` | `string` | Internal summary for moderators (not shown to user) |

Specialized endpoints for inline UX:

| Endpoint | Use case |
|----------|----------|
| `POST /ai/reviews/toxicity` | Real-time review composer warning |
| `POST /ai/reviews/spoilers` | Spoiler tag suggestions |
| `POST /ai/reviews/sentiment` | Analytics only—not enforcement |

---

## Detection Layers

### Layer 1 — Deterministic rules

| Rule | Action |
|------|--------|
| Global blocklist (slurs, threats) | Immediate `BLOCK` |
| URL spam patterns (>3 links) | `SOFT_FLAG` |
| Repeated identical content (3×/1h) | `SHADOW_LIMIT` |
| New account velocity (>10 posts/10min) | `SOFT_FLAG` all |
| Known scam phrases | `BLOCK` |
| Zero-width / homoglyph obfuscation | Normalize → re-run |

Blocklists versioned in `packages/config/moderation/blocklist-v{n}.json`. Updates deploy without app release.

### Layer 2 — AI classification

Provider: OpenAI Moderation API (primary) with in-house fine-tuned classifier (fallback).

Thresholds (default):

| Category | SOFT_FLAG | HARD_FLAG / BLOCK |
|----------|-----------|-------------------|
| Hate | ≥ 0.55 | ≥ 0.85 |
| Harassment | ≥ 0.60 | ≥ 0.88 |
| Sexual (non-gaming) | ≥ 0.70 | ≥ 0.92 |
| Violence (real-world) | ≥ 0.65 | ≥ 0.90 |
| Self-harm | ≥ 0.50 | ≥ 0.75 |
| Spam | ≥ 0.75 | ≥ 0.92 |

Gaming-context downgrade: mentions of in-game violence do not trigger `VIOLENCE` if `entityType` is `REVIEW` and game ESRB/PEGI metadata is mature-appropriate.

### Layer 3 — Image moderation

`POST /ai/images/analyze` for avatars and post attachments.

Detects: CSAM (mandatory NCMEC pipeline), explicit nudity, gore (real-world), QR phishing.

CSAM match → immediate account freeze, hash report, no retry.

### Layer 4 — Behavioral signals

| Signal | Weight |
|--------|--------|
| Prior moderation strikes | +0.1 per strike |
| Trust score (account age, verified email) | −0.1 to −0.2 |
| Community reports (3+ unique) | Auto `SOFT_FLAG` |
| Downvote ratio on content | Investigative flag |

---

## Toxicity Handling

### User-facing (compose-time)

Review and post composers call `POST /ai/reviews/toxicity` debounced 800ms.

| Score | UX |
|-------|-----|
| < 0.4 | No indicator |
| 0.4 – 0.7 | Yellow banner: "This may come across as harsh" |
| > 0.7 | Red banner: "Please revise before posting" (publish still allowed for 0.7–0.85) |
| > 0.85 | Publish button disabled until edited |

Toxicity warnings are advisory below enforcement threshold—except for `BLOCK` category matches.

### Enforcement

| `recommendedAction` | System behavior |
|---------------------|-----------------|
| `ALLOW` | Publish normally |
| `SOFT_FLAG` | Publish; enqueue human review within 24h |
| `HARD_FLAG` | Hold in `pending_moderation` state; user sees "Under review" |
| `BLOCK` | Reject with generic message; strike recorded |
| `SHADOW_LIMIT` | Visible only to author; auto-review in 4h |

---

## Spam Detection

### Text spam indicators

- Excessive capitalization (>60%)
- Crypto / gambling promotion patterns
- Follow-farming templates
- Copy-pasted review text across games (simhash distance < 3)

### Action matrix

| Spam score | Action |
|------------|--------|
| < 0.6 | Allow |
| 0.6 – 0.8 | Rate limit author (1 post/15min) |
| 0.8 – 0.95 | Soft flag + review queue |
| > 0.95 | Block + strike |

Feature matrix alignment: AI Spam Detection (P2, V2), Toxicity Detection (P2, Future)—infrastructure is built in Alpha; full enforcement ramps by phase.

---

## Human Review Queue

> **Note:** Admin API (`ADMIN_API.yaml`) is pending. Queue schema and workflows below are the target contract for `apps/admin`.

### Queue record

```typescript
interface ModerationQueueItem {
  id: string;
  entityType: ModerationEntityType;
  entityId: string;
  authorId: string;
  contentSnapshot: string;
  aiResult: ModerationResult;
  reportCount: number;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED';
  assignedModeratorId: string | null;
  createdAt: string;
  slaDeadline: string;
}
```

### Priority calculation

| Condition | Priority |
|-----------|----------|
| CSAM / imminent harm | `CRITICAL` (immediate) |
| 5+ unique reports | `HIGH` |
| `HARD_FLAG` AI result | `HIGH` |
| `SOFT_FLAG` + prior strike | `NORMAL` |
| `SOFT_FLAG` first offense | `LOW` |

### SLA targets

| Priority | First response | Resolution |
|----------|----------------|------------|
| CRITICAL | 15 min | 1 hour |
| HIGH | 4 hours | 24 hours |
| NORMAL | 24 hours | 72 hours |
| LOW | 72 hours | 7 days |

### Moderator actions

| Action | Effect |
|--------|--------|
| Approve | Publish / restore visibility |
| Reject | Delete content; notify author with reason code |
| Edit & approve | Apply redaction; publish sanitized version |
| Warn user | Strike + educational notification |
| Suspend | Temporary account restriction |
| Ban | Permanent; audit log entry |

All actions require moderator role (`SECURITY.md` RBAC) and write to `audit_log`.

---

## User Reports Integration

`POST /social/report` (SOCIAL_API) feeds the queue:

- 1 report → AI rescan bump
- 3 unique reports → `SOFT_FLAG` minimum
- 5 unique reports → `HIGH` priority

Reporter reputation weighting reduces brigading impact.

---

## Appeals

Users appeal via Settings → Moderation → Appeals (`USER_API` future endpoint).

- One appeal per decision within 14 days.
- Different moderator than original reviewer.
- Appeal resolution within 7 days.

---

## Data Retention

| Data | Retention |
|------|-----------|
| Moderation queue snapshots | 1 year |
| AI scores (metadata) | 90 days |
| Full text (rejected content) | 30 days post-resolution |
| Audit logs | 3 years |
| CSAM-related records | Per legal requirement |

---

## Observability

| Metric | Alert threshold |
|--------|-----------------|
| Queue depth | > 500 HIGH+ items |
| SLA breach rate | > 5% weekly |
| False positive rate (appeals upheld) | > 10% monthly |
| Auto-block rate | Anomaly +50% day-over-day |

PostHog: `moderation_flagged`, `moderation_blocked`, `moderation_appeal_filed`.

---

## Localization

Moderation models run on original locale text. Turkish, English, Spanish, German, French, Japanese, Korean, and Portuguese have calibrated thresholds. Unknown locale uses global thresholds.

---

## Acceptance Criteria

- No publish path bypasses Layer 1 rules.
- `POST /ai/moderation` returns within 5s p95.
- Human queue items have computed priority and SLA deadline.
- Compose-time toxicity feedback appears within 1s of typing pause.
- CSAM pathway triggers immediate freeze without content re-display.

---

## Related Documents

- [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md)
- [PROMPT_LIBRARY.md](PROMPT_LIBRARY.md)
- [ADMIN_ARCHITECTURE.md](../15_ADMIN/ADMIN_ARCHITECTURE.md)
- [SECURITY.md](../11_SECURITY/SECURITY.md)
- [AI_API.yaml](../08_API/AI_API.yaml)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 Alpha | 2026-07-10 | Initial release |
