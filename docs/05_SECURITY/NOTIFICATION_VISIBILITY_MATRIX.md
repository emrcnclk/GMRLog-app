# Notification Visibility Matrix

**Document:** `docs/05_SECURITY/NOTIFICATION_VISIBILITY_MATRIX.md`  
**Status:** **Frozen — Notification Platform Freeze v1.0** (Sprint 10.0)

---

## Visibility classes

| Class | Meaning |
|-------|---------|
| Own inbox | Only the recipient user |
| Suppressed | Event received but **no** Notification row created |
| Snapshot-safe | Title/body/actionUrl contain only what recipient may know |
| Channel-disabled | Preference matrix disables IN_APP/PUSH/EMAIL for that type |

---

## Create-time suppression (ingest)

| Condition | Result |
|-----------|--------|
| Actor === recipient | **Suppress** (except explicit self journey types: achievements, level-up, game completed, system security) |
| Social block either direction between actor and recipient | **Suppress** social/engagement types |
| Recipient cannot see source entity (private review/list/collection/tier list) | **Suppress** |
| Coarse pref off (e.g. `likes: false`) or matrix `(type, IN_APP)` disabled | **Suppress** IN_APP |
| `marketing: false` | Suppress marketing-shaped / `GAME_DISCOUNT` |
| Communication muted conversation | **Suppress** when Communication types exist (Phase 2) |
| Soft-deleted / missing source entity | **Suppress** or create with null actor + generic copy — never leak private titles |
| Upstream event replay (idempotent hit) | No second row |

---

## Read visibility

| Resource | Who |
|----------|-----|
| Notification row | Recipient only → else **404** |
| Unread count | Caller’s own count only |
| Preference document | Caller only |
| Push tokens | Caller’s tokens only |

Archived notifications: visible via archived list / get by id for recipient; excluded from default unread.

---

## Actor presentation

| Actor state | Snapshot rule |
|-------------|---------------|
| Active public profile | May include display name / avatar url in title/body or actor embed |
| Private profile | Use minimal non-revealing label consistent with Social visibility |
| Deleted / banned | Null actor; generic “A user” copy |
| System / admin | `actorId` null; type `SYSTEM` / `ADMIN_MESSAGE` |

---

## Channel visibility (delivery)

| Channel | Visibility rule |
|---------|-----------------|
| IN_APP | Created only if allowed by suppression + prefs |
| PUSH | Enqueue only if token active + prefs; **send deferred** |
| EMAIL | Enqueue only if email prefs; **send deferred** (Auth security email exception until 10.4) |

---

## North Star notes

- Do not surface Discord-style presence (`FRIEND_ONLINE`) in V1.  
- Prefer meaningful gaming/social signals over promo.  
- Quiet suppression &gt; noisy partial creates.
