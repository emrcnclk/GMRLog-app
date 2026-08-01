# GMRLOG OS — Product Metrics Dictionary

**Version:** 1.0.0  
**Document:** `docs/13_ANALYTICS/PRODUCT_METRICS.md`  
**Status:** Approved  
**Owner:** Product Team

---

## Purpose

Canonical definitions for product KPIs. Every dashboard metric must map to a row in this dictionary.

---

## Core Metrics

| Metric | Definition | Formula | Source |
|--------|------------|---------|--------|
| MALP | Monthly Active Logged Players | Unique users with ≥1 `game_log` in rolling 30d | `game_logs` |
| DAU | Daily Active Users | Unique users with any authenticated action in UTC day | `analytics_events` |
| WAU | Weekly Active Users | Unique users in rolling 7d | `analytics_events` |
| Review Rate | % users who wrote ≥1 review in 30d | reviewers / WAU | `reviews` |
| Follow Graph Density | Avg follows per active user | total follows / WAU | `social_follows` |
| Feed Engagement | Feed items with interaction / impressions | clicks+reactions / impressions | `feed_*` |
| D1 / D7 / D30 Retention | Cohort return rate | standard cohort formula | `auth.users.created_at` |

---

## Funnel Metrics

| Funnel | Steps |
|--------|-------|
| Registration | landing → signup_start → signup_complete |
| First Log | register → add_game → first_log |
| First Review | register → complete_game → publish_review |
| Social | register → follow_user → receive_notification |

---

## Quality Guardrails

- Metrics exclude banned/deleted users unless noted.
- Bot accounts filtered via `users.is_bot = false`.
- Timezone: UTC for all aggregations.

---

## Related Documents

- [SUCCESS_METRICS.md](../00_PROJECT/SUCCESS_METRICS.md)
- [ANALYTICS_ARCHITECTURE.md](ANALYTICS_ARCHITECTURE.md)
- [ANALYTICS_SPECIFICATION.md](ANALYTICS_SPECIFICATION.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-07-10 | Initial product metrics dictionary |
