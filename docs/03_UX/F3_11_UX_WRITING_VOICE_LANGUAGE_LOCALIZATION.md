# GMRLOG — Sprint F3.11: UX Writing, Voice, Language & Localization

**Document:** `docs/03_UX/F3_11_UX_WRITING_VOICE_LANGUAGE_LOCALIZATION.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F3.11 (UX Writing, Voice, Language & Localization — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** UX Communication Constitution

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](../02_DESIGN/SPRINT_F1_FOUNDATION.md) |
| 4 | Entire F2 Constitution — especially F2.17 Trust · F2.18 Accessibility · F2.20 Agency · F2.27 Privacy · F2.29 · F2.25 Growth |
| 5 | F3.1–F3.10 |
| 6 | **This document** — UX Writing, Voice, Language & Localization |

Never contradict previous freezes.

Never modify F1 · F2 · F3.1–F3.10.

This sprint answers:

> “How should GMRLOG communicate with players?”

rather than:

> “What exact text should this button contain?”

| Does | Does not |
|------|----------|
| Define product voice · UX writing · localization · terminology · communication ethics | Write final UI copy · translate strings · locale files · i18n engineering · design screens |

Align F2.18 Language Philosophy · F3.1 calm home · F3.6 state language · F3.10 same terminology across devices.

---

## Scope

**In scope:** Product voice · tone · UX writing principles · buttons · empty/error/success · dialogs · permission · privacy · safety · accessibility language · localization · inclusive language · terminology governance · future language support.

**Out of scope:**

| Forbidden in this freeze |
|--------------------------|
| Final copy |
| Translation files |
| Engineering |
| UI |
| Components |
| React Native |
| APIs |
| Sprint F3.11.1+ |

**Gate:** Stop after freeze. Do **not** continue to Sprint F3.11.1.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Product Voice |
| 3 | UX Writing Philosophy |
| 4 | Conversation Style |
| 5 | Error Language |
| 6 | Success Language |
| 7 | Empty State Language |
| 8 | Permission & Privacy Language |
| 9 | Accessibility Language |
| 10 | Localization Philosophy |
| 11 | Terminology Governance |
| 12 | Consistency Rules |
| 13 | Anti-Manipulation |
| 14 | Future Ready |
| 15 | Emotional Goal |
| 16 | Audit Checklist |

---

# 1. Mission

Language exists to help players **understand**.

Never to persuade them into behavior.

The product communicates like a calm, knowledgeable gaming companion.

| Not |
|-----|
| A marketer |
| A salesperson |
| A social media platform |

Words are part of Trust (F2.17) and Agency (F2.20).

---

# 2. Product Voice

The voice should always be:

| Always |
|--------|
| Calm |
| Honest |
| Respectful |
| Human |
| Competent |
| Friendly without pretending friendship |
| Confident without arrogance |
| Professional without being corporate |

Never:

| Never |
|-------|
| Pushy |
| Sarcastic |
| Condescending |
| Overexcited |
| Infantilizing |
| Fear-inducing |

Same voice across every platform (F3.10).

---

# 3. UX Writing Philosophy

Writing serves **comprehension**.

Never conversion.

Every sentence should answer one of:

| Question |
|----------|
| What happened? |
| What can I do? |
| What happens next? |

Never:

| Anti-goal |
|-----------|
| Create urgency |
| Create FOMO |
| Inflate importance |
| Manipulate emotion |

Button labels declare intent honestly (F3.6) — not pressure.

---

# 4. Conversation Style

The interface speaks like:

> “Here’s what happened.”

not:

> “OMG! Amazing!”

| Law |
|-----|
| No fake personality |
| No meme language as product voice |
| No internet slang as product voice |

Players may joke.

The product does not.

Gaming terminology may remain authentic when universally understood (F2.18) — never culture-specific slang for critical functionality.

---

# 5. Error Language

Errors should always explain (F3.1 · F3.4 · F3.6):

| Always |
|--------|
| What happened |
| Why |
| How to recover |

Never:

| Never |
|-------|
| Blame users |
| Use technical jargon unnecessarily |
| Hide the problem |
| Shame the player |

Error structure stays consistent everywhere (§12).

---

# 6. Success Language

Success is acknowledged **quietly**.

Philosophy examples (not final copy):

| Tone |
|------|
| Saved. |
| Published. |
| Added to Library. |
| Review updated. |

Never:

| Never |
|-------|
| Amazing! |
| Great job! |
| You’re awesome! |
| Keep going! |

Routine actions do not deserve exaggerated celebration (F3.4 · F3.6).

---

# 7. Empty State Language

Empty states should (F3.6 · F3.7):

| Should |
|--------|
| Explain the situation |
| Suggest one meaningful next step |
| Preserve dignity |

Never:

| Never |
|-------|
| Make players feel incomplete |
| Shame inactivity |
| Manufacture urgency |

---

# 8. Permission & Privacy Language

Permission requests must clearly explain (F2.27 · F3.6):

| Explain |
|---------|
| What is requested |
| Why |
| When it is used |
| What happens if declined |

Privacy language must never hide intent.

Safety wording: clear · calm · non-theatrical — aligned with Trust (F2.17).

Decline remains a dignified path — never emotional blackmail.

---

# 9. Accessibility Language

Writing must be (F2.18 · F3.1):

| Quality |
|---------|
| Plain language |
| Easy to understand |
| Screen-reader friendly |
| Consistent |
| Free of unnecessary ambiguity |

Labels for controls and states must match outcomes — Trust through wording.

---

# 10. Localization Philosophy

**English is the canonical writing reference.**

Every supported language should preserve:

| Preserve |
|----------|
| Meaning |
| Tone |
| Respect |
| Intent |

Never perform literal translation if it breaks meaning.

Localization adapts naturally.

It does not imitate English structure.

Align F2.18: localization expands access — never fragments the product into separate GMRLOGs (F3.10 kinship).

One culture.

Many languages.

---

# 11. Terminology Governance

**One concept. One name.**

Examples of frozen concept names (not exhaustive UI strings):

| Concept |
|---------|
| Library |
| Home |
| Discover |
| Review |
| Collection |
| Community |

Never alternate between synonyms randomly.

Terminology consistency is part of product trust (F3.10 same terminology across devices).

Guild ≠ Community remains linguistic law (F2.11 · F3.9).

---

# 12. Consistency Rules

| Rule |
|------|
| Same action → same wording |
| Same error → same structure |
| Same permission → same explanation |
| Same success → same confirmation |
| Same terminology everywhere |
| Same voice across every platform |

Inconsistent naming is a Trust failure felt as confusion.

---

# 13. Anti-Manipulation

Explicit bans:

| Ban |
|-----|
| Fake urgency |
| Countdown language |
| FOMO wording |
| Clickbait copy |
| Growth hacking text |
| Emotional blackmail |
| Misleading permissions |
| Artificial scarcity |
| “Only today!” |
| “Don’t miss this!” |
| “Everyone is playing!” |
| “Your friends are waiting!” |

If wording exists primarily to increase engagement rather than improve understanding, it is **unconstitutional** (F2.25 · F2.22 · F2.29).

---

# 14. Future Ready

Reserve architecture only:

| Capability |
|------------|
| Localization governance |
| Pluralization rules |
| RTL language support |
| Community translation workflow |
| Style guide expansion |
| Future language additions |

No implementation · no locale engineering · no string catalogs here.

---

# 15. Emotional Goal

Players should feel:

> “The product speaks clearly and respects me.”

Never:

> “The app is trying to convince me.”

Never:

> “The interface sounds like marketing.”

---

# 16. Audit Checklist

- [ ] Voice is calm, honest, respectful  
- [ ] UX writing serves comprehension — not conversion  
- [ ] Errors teach recovery · success understated · empty states dignified  
- [ ] Permission/privacy language transparent  
- [ ] Accessibility language plain & consistent  
- [ ] Localization preserves meaning over literal wording  
- [ ] Terminology governance: one concept · one name  
- [ ] Anti-manipulation bans explicit  
- [ ] Compatible with F1 · F2 · F3.1–F3.10  
- [ ] No UI copy · translations · implementation · engineering details · F3.11.1  

---

## Final gate

### APPROVED

**Sprint F3.11 — UX Writing, Voice, Language & Localization LOCKED.**

Stop.

Do **NOT** continue to Sprint F3.11.1.

---

## Related documents

| Doc | Role |
|-----|------|
| [SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md](../02_DESIGN/SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) | Language · localization · global-first |
| [SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md](../02_DESIGN/SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md) | Transparency · honesty |
| [SPRINT_F2_27_SECURITY_PRIVACY_DATA_GOVERNANCE.md](../02_DESIGN/SPRINT_F2_27_SECURITY_PRIVACY_DATA_GOVERNANCE.md) | Permission · privacy wording ethics |
| [SPRINT_F2_20_SETTINGS_PERSONALIZATION.md](../02_DESIGN/SPRINT_F2_20_SETTINGS_PERSONALIZATION.md) | Agency · no dark re-prompt copy |
| [F3_6_COMPONENTS_FORMS_STATES_SEARCH_EXPERIENCE.md](./F3_6_COMPONENTS_FORMS_STATES_SEARCH_EXPERIENCE.md) | Error/empty/success state philosophy |
| [F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md](./F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md) | Calm home · errors teach |
| [F3_10_RESPONSIVE_DESKTOP_CROSS_PLATFORM_EXPERIENCE.md](./F3_10_RESPONSIVE_DESKTOP_CROSS_PLATFORM_EXPERIENCE.md) | Same terminology across devices |
| [F3_9_COMMUNITY_CREATOR_SOCIAL_EXPERIENCE.md](./F3_9_COMMUNITY_CREATOR_SOCIAL_EXPERIENCE.md) | Non-performative social voice |
| [F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md](./F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md) | **LOCKED** UX Governance · F3 CLOSE |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Recognizability · culture-first |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Communication constitution: calm companion voice; comprehension over conversion; localization meaning-first; terminology governance; anti-FOMO copy bans |
