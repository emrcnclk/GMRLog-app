# Post-MVP Product Backlog

**Document:** `docs/00_PROJECT/POST_MVP_PRODUCT_BACKLOG.md`  
**Date:** 2026-07-21  
**Created by:** Sprint 16.6 — Backend MVP Declaration  
**Scope:** Product / Phase 2+ features **deferred after Backend MVP feature freeze**  
**Related:** [`ROADMAP.md`](../01_PRODUCT/ROADMAP.md) · [`FEATURE_MATRIX.md`](../01_PRODUCT/FEATURE_MATRIX.md) · [`BACKEND_MVP_COMPLETE.md`](./BACKEND_MVP_COMPLETE.md)

Every item below is **product roadmap** work. Do **not** treat as open Backend MVP engineering debt.

Backend may only change for these items under an explicit Phase 2 (or later) Freeze / change-control.

---

## Phase 2 — Closed Beta (product)

| Item | Notes | Status |
|------|-------|--------|
| Friends product APIs | Friend requests / friendship UX beyond Social Graph follow | Deferred — Phase 2 |
| Push notification send | Notification Freeze Phase 2 (in-app V1 complete) | Deferred — Phase 2 |
| Email notification send | Notification Freeze Phase 2 | Deferred — Phase 2 |
| WebSocket messaging | Real-time DM/groups beyond Communication REST V1 | Deferred — Phase 2 |
| Meilisearch / advanced search | Search Freeze Phase 2 (SQL V1 complete) | Deferred — Phase 2 |
| AI surfaces | `AI_API.yaml` spec-only; no Nest AI BC in MVP | Deferred — Phase 2+ |
| Recommendations | Product / ML ranking | Deferred — Phase 2+ |
| Admin FeatureFlags / Jobs UI | Admin Phase 2 console product | Deferred — Phase 2 |
| Analytics `ai` / `releases` dashboards | Analytics deferred 404 in V1 | Deferred — Phase 2 |
| Achievements HTTP product API | Background consumers exist; public API optional | Deferred — Phase 2 |
| TierList like / bookmark junctions | Vote exists; optional schema expansion | Deferred — Phase 2 |
| SOCIAL feed discover / following / trending routes | Spec stubs ahead of Nest — invent only under Freeze | Deferred — Phase 2 |

---

## Phase 3 / Public Launch (selected)

| Item | Notes | Status |
|------|-------|--------|
| Developer / Studio product pages | Feature Matrix public MVP items | Deferred — Phase 3 |
| Voice Platform | Communication Phase 2 / Voice — not Closed Beta messaging | Deferred after MVP |
| Premium (Feature Matrix DOMAIN 16) | Separate product track — **not** Module 16 | Deferred — Premium |

---

## Posts Phase 2+ (explicitly out of Backend MVP)

Bookmarks · Pinned posts · Quote posts · Polls · Communities · Articles / Premium Articles · Trending hashtags · Stories · Scheduling · GIF/Video providers · Translation

**Scheduling note (July 2026):** Bookmarks · Pin · Quote · Poll · GIF/Video · Communities feed/roles · Events RSVP · Feed Engine v2 are scoped under planned sprint **D3.24 — Social Feed, Communities & Events** (`docs/07_SOCIAL/D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md`). Articles / Premium / Stories / scheduling / translation remain deferred outside D3.24.

---

## Client applications (primary next milestone)

| Item | Notes | Status |
|------|-------|--------|
| React Native (Expo) iOS / Android | Auth, navigation, Feed, Games, Reviews, Game Logs, Posts, Notifications | **Next primary focus** |
| Admin Web | Staff console over existing Admin / Moderation / Analytics APIs | Parallel track |

---

## Ownership

Product schedules Phase 2 Freezes after client Alpha readiness. Engineering production work remains in [`POST_MVP_PRODUCTION_BACKLOG.md`](./POST_MVP_PRODUCTION_BACKLOG.md).
