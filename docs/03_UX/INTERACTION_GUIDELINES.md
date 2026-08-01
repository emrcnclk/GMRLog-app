# GMRLOG OS — Interaction Guidelines

**Version:** 1.0.0  
**Document:** `docs/03_UX/INTERACTION_GUIDELINES.md`  
**Status:** Approved (subordinate)  
**Owner:** UX Team

> **UX Constitution:** [`F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md`](./F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md) (**LOCKED**).  
> **Interaction feel:** [`F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md`](./F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md) (**LOCKED**). On conflict, F3.4 + F3.1 + F2 + Master win.

---

## Purpose

Define interaction patterns, feedback timing, and gesture vocabulary across web and mobile. Complements `MOTION_GUIDELINES.md` (visual motion) with behavioral rules. Subordinate to F3.1.

---

## Feedback Timing

| Action | Feedback | Max delay |
|--------|----------|-----------|
| Tap / click | Visual press state | 0ms |
| Navigation | Transition begins | < 100ms |
| API read | Skeleton or spinner | < 200ms show threshold |
| API write | Optimistic UI + toast | immediate optimistic |
| Error | Inline or toast | < 100ms after response |
| Success | Toast or checkmark | 2s auto-dismiss |

---

## Gestures (Mobile)

| Gesture | Action |
|---------|--------|
| Pull down | Refresh feed |
| Swipe back | Pop navigation stack |
| Long press | Context menu |
| Edge swipe | Drawer (where applicable) |

---

## Forms

- Validate on blur, not on every keystroke (except password strength).
- Submit button disabled until valid; show errors on submit attempt.
- Destructive actions require confirmation modal.

---

## Accessibility Interactions

- All actions keyboard-accessible on web.
- Focus trap in modals; restore focus on close.
- Minimum touch target 44×44pt mobile.

---

## Related Documents

- [MOTION_GUIDELINES.md](../02_DESIGN/MOTION_GUIDELINES.md)
- [ACCESSIBILITY.md](../02_DESIGN/ACCESSIBILITY.md)
- [NAVIGATION_SPECIFICATION.md](NAVIGATION_SPECIFICATION.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-07-10 | Initial interaction guidelines |
