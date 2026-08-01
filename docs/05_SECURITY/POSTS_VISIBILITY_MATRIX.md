# Posts Visibility Matrix

**Document:** `docs/05_SECURITY/POSTS_VISIBILITY_MATRIX.md`  
**Status:** **Frozen — Posts Platform Freeze v1.0** (Sprint 16.1)

---

## Visibility classes

| Class | Meaning |
|-------|---------|
| Public | `Visibility.PUBLIC` post readable per Permission Matrix |
| Followers | `FOLLOWERS` — author + followers only |
| Private | `PRIVATE` — author only (+ staff ports) |
| Hidden | Soft-deleted (`deletedAt`) — public **404** |
| Suppressed | Block / banned author / pref — omit from timelines |

---

## 404 vs 403 (normative)

| Situation | Status | Rationale |
|-----------|--------|-----------|
| Post missing, deleted, or not visible to caller | **404** | Existence oracle reduction |
| Authenticated but insufficient role on staff route | **403** | Role deny |
| Self-report | **403** | Policy |
| Like own post | **200** allowed (product) or no-op — not 403 | Implementation may allow |
| Reply to invisible post | **404** | Same as GET |

---

## Timeline exposure

| Surface | Includes |
|---------|----------|
| Author timeline (public view) | Non-deleted posts viewer may see |
| Home feed | Feed BC projection — respects post visibility at fan-out time |
| Hashtag timeline | PUBLIC (and FOLLOWERS only if viewer qualifies) — never PRIVATE of others |
| Search hits | Search suppresses deleted / invisible per Search Freeze |

---

## Media

| Audience | Behavior |
|----------|----------|
| Visible post | Media URLs may be returned (signed/public per Platform storage policy) |
| Hidden / invisible post | Do not return media URLs |

---

## Mentions / replies notifications

Visibility of the **source post** must still allow the notified user to open it; else suppress notification create (Notification Visibility alignment).

---

## Staff

| Surface | Visible |
|---------|---------|
| Moderation queue detail | Redacted preview — ids, reason, truncated body |
| Public product GET | Still 404 when soft-deleted for non-staff |

---

## Related

- Permission: [`POSTS_PERMISSION_MATRIX.md`](./POSTS_PERMISSION_MATRIX.md)  
- Freeze: [`POSTS_PLATFORM_FREEZE_v1.md`](../00_PROJECT/POSTS_PLATFORM_FREEZE_v1.md)
