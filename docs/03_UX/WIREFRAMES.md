# GMRLOG OS — Wireframes Specification

**Version:** 1.0.0  
**Document:** `docs/03_UX/WIREFRAMES.md`  
**Status:** Approved (subordinate)  
**Owner:** UX Team

> **Hierarchy constitution:** [`F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md`](./F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md) (**LOCKED**). Wireframes must obey attention order before visual design.

---

## Purpose

Define the wireframe ID system and screen inventory. Visual wireframe assets live in Figma (see `FIGMA_CONVENTIONS.md`); this document is the engineering index linking wireframes to `SCREEN_SPECIFICATIONS.md`.

---

## ID Convention

```
WF-{platform}-{area}-{screen}-{variant}
```

| Segment | Values |
|---------|--------|
| platform | `web`, `mob`, `shared` |
| area | `auth`, `feed`, `game`, `profile`, `social`, `create`, `settings` |
| screen | kebab-case name |
| variant | `default`, `empty`, `error`, `loading` |

Example: `WF-mob-feed-home-default`

---

## Screen Inventory (v1 P0)

| Wireframe ID | Screen Spec ID | Figma page |
|--------------|----------------|------------|
| WF-mob-auth-login-default | SCR-AUTH-001 | Auth / Login |
| WF-mob-auth-register-default | SCR-AUTH-002 | Auth / Register |
| WF-mob-feed-home-default | SCR-FEED-001 | Feed / Home |
| WF-mob-game-detail-default | SCR-GAME-001 | Game / Detail |
| WF-mob-profile-public-default | SCR-PROF-001 | Profile / Public |
| WF-mob-profile-edit-default | SCR-PROF-002 | Profile / Edit |
| WF-mob-review-compose-default | SCR-REV-001 | Review / Compose |
| WF-web-feed-home-default | SCR-FEED-001-W | Web / Feed |

Full mapping maintained in Figma component `Wireframe Registry`.

---

## States Required Per Screen

Every wireframe must document: default, empty, loading, error, offline (mobile).

---

## Related Documents

- [SCREEN_SPECIFICATIONS.md](../02_DESIGN/SCREEN_SPECIFICATIONS.md)
- [FIGMA_CONVENTIONS.md](../02_DESIGN/FIGMA_CONVENTIONS.md)
- [USER_JOURNEYS.md](USER_JOURNEYS.md)
- [INFORMATION_ARCHITECTURE.md](INFORMATION_ARCHITECTURE.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-07-10 | Initial wireframe specification index |
