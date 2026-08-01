# GMRLOG OS — Storybook Guide

**Version:** 1.0.0  
**Document:** `docs/02_DESIGN/STORYBOOK_GUIDE.md`  
**Status:** Approved (subordinate)  
**Owner:** Frontend Team

> **SSOT:** [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) (**LOCKED**). Stories must reflect Master signatures and tokens.

---

## Purpose

Define Storybook organization, story conventions, and visual regression workflow for `packages/ui`.

---

## Location

```
packages/ui/
├── src/components/
├── stories/          # Co-located *.stories.tsx
└── .storybook/
```

---

## Story Naming

```
{ComponentName}/{Variant}
```

Examples: `Button/Primary`, `ReviewCard/WithSpoilers`, `Avatar/Verified`

---

## Required Story States

Every component story must include:

- Default
- Loading (if applicable)
- Empty
- Error
- Dark mode variant

---

## Args & Controls

Use typed `args` matching component props. Document prop table via JSDoc → autodocs.

---

## Visual Regression

- Chromatic or Percy on PR for `packages/ui` changes.
- Threshold: 0.1% pixel diff requires design review.

---

## Accessibility Addon

Every story run through `@storybook/addon-a11y` — zero critical violations in CI.

---

## Related Documents

- [COMPONENT_LIBRARY.md](COMPONENT_LIBRARY.md)
- [DESIGN_TOKENS.md](DESIGN_TOKENS.md)
- [ACCESSIBILITY.md](ACCESSIBILITY.md)
- [TESTING_STRATEGY.md](../12_TESTING/TESTING_STRATEGY.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-07-10 | Initial Storybook guide |
