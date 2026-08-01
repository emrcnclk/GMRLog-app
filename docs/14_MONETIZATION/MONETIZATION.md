# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/14_MONETIZATION/MONETIZATION.md`

**Status:** Approved (subordinate entitlements)

**Owner:** Product Team

**Classification:** Internal Product Documentation

> **Ethics SSOT:** [`docs/02_DESIGN/SPRINT_F2_16_PREMIUM_MEMBERSHIP.md`](../02_DESIGN/SPRINT_F2_16_PREMIUM_MEMBERSHIP.md) (**LOCKED** Premium).  
> **Commerce constitution:** [`docs/02_DESIGN/SPRINT_F2_26_MONETIZATION_COMMERCE_SUSTAINABLE_ECONOMY.md`](../02_DESIGN/SPRINT_F2_26_MONETIZATION_COMMERCE_SUSTAINABLE_ECONOMY.md) (**LOCKED**).  
> Entitlements and tiers in this file must never violate F2.16 / F2.26. On conflict, F2.16 (Premium) + F2.26 (commerce) + Master Creator Economy win.

---

# Monetization

## Purpose

This document defines GMRLOG's premium product model: subscription tiers, entitlements, pricing philosophy, and feature gating at the product level.

**This document does not specify payment processor integration, billing webhooks, or tax handling**—those are engineering concerns for a future billing ADR.

---

## Monetization Philosophy

GMRLOG monetization follows [PRODUCT_PRINCIPLES.md](../01_PRODUCT/PRODUCT_PRINCIPLES.md):

- The core social gaming experience remains free and complete.
- Premium enhances identity, creativity, and insights—not pay-to-win social visibility.
- No ads in the initial product vision.
- Monetization must not degrade feed quality or discovery fairness.

> Premium does not mean adding unnecessary visual effects. Premium means meaningful depth for dedicated players.

---

## Revenue Streams (Roadmap)

| Stream | Phase | Priority |
|--------|-------|----------|
| Player subscription (GMRLOG Premium) | V2 | P2 |
| Developer / Studio subscription | V2+ | P2 |
| Creator tools (future) | Future | P3 |
| Marketplace / launcher | Out of scope | — |

Launch focus (Alpha → V1): growth and retention before monetization per [ROADMAP.md](../01_PRODUCT/ROADMAP.md).

---

## Player Tiers

### Free (default)

Every registered user. Role: `User` in RBAC.

**Included:**

- Full social graph (follow, friends, messages)
- Unlimited reviews and posts (subject to fair-use rate limits)
- Game logging and public profile
- Standard collections and tier lists (platform limits below)
- Deterministic search (Meilisearch)
- Basic AI assist within monthly quota ([AI_ARCHITECTURE.md](../09_AI/AI_ARCHITECTURE.md))
- Standard profile customization (avatar, banner, bio)

**Limits:**

| Resource | Free limit |
|----------|------------|
| Collections | 10 |
| Tier lists | 5 |
| List items per list | 50 |
| AI tokens / month | 50,000 |
| Profile theme | Default dark/light only |
| Profile visitors history | Hidden |

---

### GMRLOG Premium

Target release: **V2**. Role: `Premium` in RBAC (additive to `User`).

**Positioning:** For players who want deeper identity expression, richer curation, and AI-assisted creativity.

#### Premium entitlements

| Feature | Benefit |
|---------|---------|
| Premium badge | Visible on profile and posts |
| Profile themes | Extended color accents, optional OLED-optimized palettes |
| Animated profile elements | Subtle banner/avatar motion (within MOTION_GUIDELINES) |
| Unlimited collections | No collection count cap |
| Extended tier lists | 25 tier lists, 100 items each |
| Advanced profile analytics | Who viewed profile, taste trends over time |
| Increased AI quota | 500,000 tokens / month |
| Early access | Beta features 2 weeks before general release |
| Priority support | In-app support queue priority |

#### Features explicitly not premium-gated

- Feed reach and algorithmic ranking
- Ability to review, post, and message
- Game discovery search (non-AI)
- Friend and follower limits
- Core game logging

---

## Developer / Studio Tiers (Future)

For verified `Developer` and `Studio` roles.

| Tier | Audience | Entitlements |
|------|----------|--------------|
| Developer Free | Indie verified devs | Developer page, basic analytics |
| Developer Pro | Commercial studios | Advanced analytics, announcement tools, API insights |
| Studio Enterprise | Large publishers | Multi-title dashboard, team seats, SLA support |

Pricing and payment implementation deferred to billing ADR. Role assignment remains manual verification during Beta.

---

## Feature Matrix Cross-Reference

From [FEATURE_MATRIX.md](../01_PRODUCT/FEATURE_MATRIX.md) DOMAIN 16 — Premium:

| Feature | Priority | Release |
|---------|----------|---------|
| Premium Badge | P2 | V2 |
| Profile Themes | P2 | Future |
| Animated Profile | P3 | Future |
| Advanced Analytics | P2 | Future |
| Unlimited Collections | P2 | Future |
| Early Access Features | P2 | Future |

---

## Entitlement Model (Product)

```text
User account
  └── subscription_tier: FREE | PREMIUM | DEVELOPER_PRO | STUDIO_ENTERPRISE
  └── entitlements[]: resolved from tier + overrides
  └── effective_at / expires_at (subscription period)
```

Entitlements are evaluated server-side on every gated action. Clients display upsell UI; they do not enforce gates.

### Example entitlement keys

| Key | Free | Premium |
|-----|------|---------|
| `collections.unlimited` | false | true |
| `profile.themes` | false | true |
| `profile.analytics` | false | true |
| `ai.tokens.monthly` | 50000 | 500000 |
| `badge.premium` | false | true |
| `features.early_access` | false | true |

---

## Upsell Touchpoints

Premium CTAs appear only in context—never blocking core flows.

| Surface | Trigger |
|---------|---------|
| Profile settings → Themes | Tap locked theme |
| Collection create | Approaching 10-collection limit |
| AI composer | Quota > 80% consumed |
| Profile analytics | Tap "Who viewed your profile" |
| Settings → GMRLOG Premium | Always available, low pressure |

Copy tone: informative, not manipulative. No dark patterns, countdown timers, or social guilt.

---

## AI and Premium

AI quota tiers defined in [AI_ARCHITECTURE.md](../09_AI/AI_ARCHITECTURE.md). Premium increases token budget and daily request caps; it does not grant access to separate models at launch.

Future consideration: premium-only AI features (e.g. batch collection generation) require product review and FEATURE_MATRIX update before implementation.

---

## Analytics and Success Metrics

Track per [SUCCESS_METRICS.md](../00_PROJECT/SUCCESS_METRICS.md):

| Metric | Target philosophy |
|--------|-------------------|
| Free → Premium conversion | Measure after retention stabilizes (V2+) |
| Premium churn (monthly) | < 5% |
| ARPU | Secondary to DAU/retention pre-V2 |
| Upsell impression → conversion | Optimize without harming NPS |

PostHog events: `premium_upsell_viewed`, `premium_upsell_converted`, `premium_feature_used`.

---

## Compliance and Policy

- Regional pricing and tax: determined at billing implementation
- Refund policy: 14-day goodwill window (product policy; legal review required)
- Minor accounts: Premium requires age-appropriate consent per regional law
- Subscription status must sync to `roles` claim within 60 seconds of state change

---

## Engineering Boundaries (Out of Scope Here)

The following require separate technical specifications when billing begins:

- Stripe / RevenueCat / App Store / Play Billing integration
- Webhook handlers and idempotent subscription sync
- Invoice, proration, and grace period logic
- `MONETIZATION_API.yaml` (not yet created)
- PCI scope minimization

Until then, `Premium` role may be assigned manually in admin tools for dogfooding.

---

## Acceptance Criteria

- Free tier delivers complete core social gaming experience.
- Premium entitlements are documented with clear limits vs. free.
- No feed, discovery, or social graph features are paywalled.
- Entitlement keys are defined for backend implementation readiness.
- Payment implementation is explicitly deferred.

---

## Related Documents

- [PRODUCT_PRINCIPLES.md](../01_PRODUCT/PRODUCT_PRINCIPLES.md)
- [PRODUCT_VISION.md](../01_PRODUCT/PRODUCT_VISION.md)
- [FEATURE_MATRIX.md](../01_PRODUCT/FEATURE_MATRIX.md)
- [AI_ARCHITECTURE.md](../09_AI/AI_ARCHITECTURE.md)
- [SECURITY.md](../11_SECURITY/SECURITY.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 Alpha | 2026-07-10 | Initial release |
