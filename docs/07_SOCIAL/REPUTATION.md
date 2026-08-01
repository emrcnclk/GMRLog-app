# Gaming Reputation (D3.24 v1.3)

**Document:** `docs/07_SOCIAL/REPUTATION.md`  
**Status:** **PLANNED**  
**Authority:** F2.13 / Trust · anti-vanity · [`D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md`](./D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md)

---

## Mission

Not Twitter blue-check. **Gaming Reputation** from behavior — signals Trust and craft, not purchase.

---

## Reputation badges (closed catalog v1)

| Badge | Deterministic signal sketch |
|-------|----------------------------|
| Helpful Reviewer | Review helpful marks / positive reply ratio thresholds |
| Strategy Expert | Guide engagement + game-tag concentration |
| Lore Master | Long-form guides / wiki contributions |
| Achievement Hunter | Rare / platinum density |
| Community Leader | Community role tenure + constructive moderation actions |

Exact thresholds = versioned product constants. Awarded by jobs — **no AI classifier**.

---

## Storage

`user_reputations` (userId · badgeKey · awardedAt · evidenceJson?) or reuse achievement-like definitions with `category=reputation`.

Visible on Profile Hero / Creator surfaces. Revocable via Moderation.

---

## Anti-patterns

Paid badges · follower-count badges · engagement-farm badges · dark-pattern “boost reputation”.
