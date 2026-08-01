# GMRLOG — Sprint F6.8: Testing Architecture

**Document:** `docs/06_ENGINEERING/F6_8_TESTING_ARCHITECTURE.md`  
**Version:** 1.0  
**Status:** **DRAFT**  
**Sprint:** F6.8 (Testing Architecture — organization only)  
**Last Updated:** July 2026  
**Owner:** Engineering Architecture Director  
**Classification:** Engineering Architecture

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | Entire F1 |
| 4 | Entire F2 |
| 5 | Entire F3 |
| 6 | Entire F4 |
| 7 | Entire F5 (**LOCKED** product architecture — F5.1–F5.5) |
| 8 | [`F6_1_ENGINEERING_ARCHITECTURE.md`](./F6_1_ENGINEERING_ARCHITECTURE.md) — engineering organization · testing philosophy |
| 9 | [`F6_2_FRONTEND_ARCHITECTURE.md`](./F6_2_FRONTEND_ARCHITECTURE.md) — client organization under test |
| 10 | [`F6_3_BACKEND_ARCHITECTURE.md`](./F6_3_BACKEND_ARCHITECTURE.md) — platform organization under test |
| 11 | [`F6_4_API_ARCHITECTURE.md`](./F6_4_API_ARCHITECTURE.md) — contract surface under test |
| 12 | [`F6_5_DATA_ARCHITECTURE.md`](./F6_5_DATA_ARCHITECTURE.md) — durable truth · projections under test |
| 13 | [`F6_6_REALTIME_BACKGROUND_JOBS_ARCHITECTURE.md`](./F6_6_REALTIME_BACKGROUND_JOBS_ARCHITECTURE.md) — async delivery under test |
| 14 | [`F6_7_SECURITY_ARCHITECTURE.md`](./F6_7_SECURITY_ARCHITECTURE.md) — Trust boundaries under test |
| 15 | [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) · [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) · [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) — subordinate engineering projections |
| 16 | **This document** — Testing Architecture Specification (how testing is organized) |

Never contradict previous freezes.

Never redesign the product.

Never redesign UX or UI.

Never change Information Architecture.

Never invent MVP features.

Never redefine ownership — **all ownership comes from F5.1**.

This sprint specifies **HOW testing is organized**.

| Layer | Role relative to this document |
|-------|--------------------------------|
| F1–F4 | Constitutional product · UX · UI law — behaviours to protect, not to invent in tests |
| F5 | Product truth — **LOCKED** — what may exist and how it behaves |
| F6.1–F6.7 | Engineering truth — how software is organized |
| **F6.8** | How **verification** is organized so constitutions remain enforceable |

This sprint answers:

> “How is testing organized?”

rather than:

> “How does Jest/Vitest/Playwright work?” · “How do I write a test?” · “What is the coverage number?”

| Does | Does not |
|------|----------|
| Define testing philosophy · principles · pyramid · unit · integration · contract · component · E2E · accessibility · performance · security testing · test data · mocks · regression · CI gates · failure philosophy · dependency rules | Test code · framework tutorials · configuration · YAML · coverage percentages · commands · npm scripts · folder trees · example assertions · implementation details |

**Stack note:** `TECH_STACK_DECISIONS.md` approves Vitest · Jest · React Native Testing Library · Testing Library · Playwright · Supertest · k6 (and related kinship). This document assigns **roles** to layers of verification. It does **not** configure tools, invent alternatives, or teach APIs. Stack changes require ADR. Coverage targets in `CODING_STANDARDS.md` remain subordinate discipline under this philosophy — numeric targets are not restated here as architecture.

**Gate:** Stop after this specification. Do **not** continue to Sprint F6.9 in this deliverable.

---

## Scope

**In scope:** Mission · relationship to prior constitutions · testing philosophy · testing principles · testing pyramid · unit · integration · contract (API SDK ↔ Backend) · component · end-to-end · accessibility · performance · security testing · test data philosophy · mock philosophy · regression philosophy · continuous integration gates · failure philosophy · dependency rules.

**Out of scope:**

| Forbidden |
|-----------|
| Test source code · example suites · assertion samples |
| Jest / Vitest / Playwright / Cypress tutorials or snippets |
| Configuration files · CI YAML · npm scripts · commands |
| Coverage percentages · quota tables as constitutional law |
| Folder trees presented as mandatory file layouts |
| Product · UX · UI · IA redesign · new MVP features |

---

## Deliverable map

| Part | §§ | Title |
|------|----|-------|
| A | 1–4 | Mission · Relationship · Testing Philosophy · Testing Principles |
| B | 5–13 | Pyramid · Unit · Integration · Contract · Component · E2E · Accessibility · Performance · Security |
| C | 14–18 | Test Data · Mocks · Regression · CI Gates · Failure Philosophy |
| D | 19–21 | Dependency Rules · Anti-Patterns · Audit Checklist |

---

# PART A — FOUNDATION

---

# 1. Mission

Define the testing organization that every future suite, gate, and verification decision must obey.

Testing protects the Digital Home by making constitutions **enforceable**. Testing never becomes a second Source of Truth for product meaning.

| Prefer | Never |
|--------|-------|
| Stable tests over clever tests | Cleverness that hides ownership |
| Reproducibility over speed | Flaky speed theater |
| Behaviour and contracts over implementation trivia | Locking internals that may refactor under the same law |
| Constitutional journeys | Coverage vanity without Trust |
| Clear layer intent | One mega-suite that pretends to be every layer |

---

# 2. Relationship to Previous Constitutions

| Prior law | Testing obligation |
|-----------|--------------------|
| F5 (LOCKED) | **Product behaviour always originates from F5.** Tests verify screens · ownership · interactions · MVP scope — they do not invent them |
| F5.1 | Ownership and Shared Destination singularity must remain testable — no suite may encode a sixth root |
| F5.3 · F5.4 | Player journeys and honest states (loading · empty · error · pending) are first-class verification subjects |
| F5.5 §20.1 | Version 2 scopes are not “validated into existence” by MVP test scaffolding |
| F3 · F4 | Accessibility · calm honesty · Design System restraint — a11y and visual/component kinship where established |
| F6.1 §20 | Tests protect organization, contracts, and Trust — not vanity coverage alone |
| F6.2 | Client layers · offline honesty · optional integrations absent/connected modes |
| F6.3 | Domain boundaries · controller/service/repository responsibilities · authn/authz |
| F6.4 | Contract tests guarantee API dialect compatibility · additive evolution |
| F6.5 | Authoritative store vs projections · rebuildability · external data subordination |
| F6.6 | Jobs idempotent · realtime optional for correctness · failed jobs never corrupt durable data |
| F6.7 | Security testing validates Trust boundaries — client-only security tests are insufficient |
| `TECH_STACK_DECISIONS.md` · `CODING_STANDARDS.md` · `packages/testing` | Approved tools and shared fixtures — subordinate to this organization |

On conflict, the higher law wins. A green suite that contradicts F5 is wrong.

---

# 3. Testing Philosophy

## 3.1 Immutable testing laws

| Law |
|-----|
| **Testing protects Trust.** |
| **Tests verify constitutions.** |
| **Tests never define product behaviour.** |
| **Product truth comes from F5.** |
| **Engineering truth comes from F6.** |
| **Tests never become the Source of Truth.** |
| **Every important behaviour must be testable.** |
| **Tests verify architecture, they do not replace architecture.** |
| **Unit tests verify isolated behaviour.** |
| **Integration tests verify collaboration.** |
| **Contract tests guarantee API compatibility.** |
| **End-to-end tests verify player journeys.** |
| **Accessibility testing is mandatory.** |
| **Performance testing validates architectural promises.** |
| **Security testing validates Trust boundaries.** |
| **Regression tests protect constitutional behaviour.** |
| **CI must fail on constitutional regressions.** |
| Stable tests over clever tests |
| Reproducibility over speed |

## 3.2 What testing is for

| Is | Is not |
|----|--------|
| Enforcement of F5 product law and F6 organization | A place to invent features “so we can test them” |
| Proof that ownership · contracts · Trust still hold | A substitute for documentation or architecture |
| Protection against silent drift | Engagement manipulation success criteria (F6.1 §20) |
| Honest failure when constitutions break | Permission to ship with known constitutional holes |

---

# 4. Testing Principles

| Principle |
|-----------|
| Prefer behaviour observable at the correct boundary over private implementation detail |
| One test intent → one clear layer — do not disguise E2E as unit |
| Shared Destinations tested in shared-module / shared-domain suites — not only under a presenting tab (F6.1 §20) |
| Optional integrations tested in connected and absent modes |
| Offline / pending / error paths are first-class — not happy-path-only |
| Determinism: no hidden shared mutable state · no order dependence · no random timing as design |
| Fixtures and factories live in shared testing capability (`packages/testing` kinship) — not copied folklore |
| Flaky tests are defects in the suite — not acceptable permanent debt (F6.1 §20) |
| Snapshots alone are not architecture proof |

---

# PART B — TEST LAYERS

---

# 5. Testing Pyramid

| Layer | Relative volume (philosophy) | Proves |
|-------|------------------------------|--------|
| Unit | Broadest base | Isolated behaviour · pure rules · mappers · validators |
| Integration | Middle | Collaboration across module boundaries · repositories · facades |
| Contract | Narrow, mandatory bridge | API SDK ↔ Backend agreement |
| Component | Client UI family behaviour | Design System / composition honesty without full journeys |
| End-to-end | Narrow peak | Critical player journeys across F5 screens |
| Accessibility · Performance · Security | Cross-cutting gates | Constitutional a11y · architectural promises · Trust boundaries |

| Pyramid laws |
|--------------|
| Lower layers catch ownership and rule defects early |
| Upper layers prove journeys — they do not replace unit/integration proof |
| Do not invert the pyramid into “only E2E” or “only snapshots” |

---

# 6. Unit Testing

| Principle |
|-----------|
| **Unit tests verify isolated behaviour.** |
| Subjects: pure domain rules · mappers · validators · small policy helpers · deterministic transforms |
| Unit tests do not require a full app boot · database · or network |
| External boundaries are replaced only at the edge of the unit — never by rewriting the subject into a mock of itself |
| Unit success never claims API compatibility or journey correctness alone |

---

# 7. Integration Testing

| Principle |
|-----------|
| **Integration tests verify collaboration.** |
| Subjects: domain services with repositories · feature facades with API ports · job handlers with exported domain surfaces · module boundary contracts inside the platform or client |
| Integration proves that ownership edges still collaborate without forking Shared Destinations |
| Prefer realistic collaboration inside the boundary under test — avoid theatrical mock webs that prove nothing |
| Integration does not replace contract tests at the public API boundary |

---

# 8. Contract Testing (API SDK ↔ Backend)

| Principle |
|-----------|
| **Contract tests guarantee API compatibility.** |
| The public dialect (F6.4) and generated `@gmrlog/api` SDK must agree with the platform producer (F6.3) |
| Contract verification protects additive evolution · envelope honesty · error categories · pagination philosophy — without becoming an endpoint encyclopedia in this document |
| Breaking the contract fails CI — silent drift banned (F6.4 §23 · F6.1) |
| Staff and player surfaces remain isolated in contract scope where product law isolates them |
| Contract tests never invent Version 2 public API under MVP |

---

# 9. Component Testing

| Principle |
|-----------|
| Component tests verify Design System families and feature composition behaviour at the UI object boundary (F4.8 · F5.4 · F5.5 · F6.2 §8) |
| Focus: states (loading · empty · error · disabled · pending) · accessibility props inheritance · semantic token consumption honesty at the component contract |
| Component tests are not full player journeys — they do not replace E2E |
| Visual / component regression kinship (where established) proves Design System restraint — not screenshot vanity for every screen |
| Feature-specific Design System forks must fail review — tests must not normalize forks as “accepted baselines” |

---

# 10. End-to-End Testing

| Principle |
|-----------|
| **End-to-end tests verify player journeys.** |
| Journeys map to F5.3 screens and F5.1 ownership — Home heartbeat · Search · Game relationship · Library archive · gate flows · critical Shared Destinations |
| E2E proves orientation across real collaboration of client and platform under test environments — not every edge case in the universe |
| Selectors and journey steps prefer stable product meaning over brittle layout trivia |
| E2E must include honest failure/recovery paths where Trust matters — not only celebratory happy paths |
| E2E never encodes engagement manipulation as success |

---

# 11. Accessibility Testing

| Principle |
|-----------|
| **Accessibility testing is mandatory.** |
| A11y obligations (F3 kinship · WCAG AA per stack docs · F6.2 §16) are enforceable gates — not a post-launch backlog |
| Verify that F5.4 states are announced · roles/labels present · reduced motion and scaling kinship respected where architecture promises them |
| Shared component families carry a11y contracts — feature assemblies verify they did not break inheritance |
| Accessibility regressions are constitutional defects |

---

# 12. Performance Testing

| Principle |
|-----------|
| **Performance testing validates architectural promises.** |
| Promises come from F6.1 §19 · F6.2 journey calm · F6.5 projection honesty · F6.6 non-blocking side effects — not from casino urgency |
| Subjects: critical journeys · write path under load kinship · projection lag honesty · queue backpressure without corrupting durable truth |
| Performance tests never license IA forks · Design System forks · or dual authoritative stores “for speed” |
| Numeric budgets, when defined, live in subordinate performance docs — they must not contradict this philosophy |

Approved tool kinship includes k6 per `TECH_STACK_DECISIONS.md`. This document does not define scripts or thresholds.

---

# 13. Security Testing

| Principle |
|-----------|
| **Security testing validates Trust boundaries.** |
| Subjects: authn vs authz separation · default deny · validation ≠ authorization · guest providers never identity authorities · secrets never in clients · workers/realtime not Trust bypasses (F6.7 · F6.6) |
| **Client-only security tests are insufficient** — platform enforcement must be verified |
| Abuse and rate-limit classes are tested as protection outcomes — never as user-manipulation success |
| Security failures must demonstrate safe failure — privilege must not remain open when uncertain |
| Security testing never becomes a product feature or player-facing fear surface |

---

# PART C — ORGANIZATION · GATES · FAILURE

---

# 14. Test Data Philosophy

| Principle |
|-----------|
| Test data expresses product meaning under F5 ownership — factories create owned entities with canonical identity kinship (F6.5 §7.1) |
| Prefer explicit, minimal fixtures over mysterious global dumps |
| Sensitive data in tests is fake and minimized — never production secrets or real player archives |
| Guest integration fixtures cover connected and absent modes |
| Soft-deleted · pending · confirmed states are first-class data shapes where product law distinguishes them |
| Shared factories live in shared testing capability — domains do not fork incompatible “almost the same” entities |

---

# 15. Mock Philosophy

| Principle |
|-----------|
| **Mock external boundaries** — guest providers · third-party push · object storage edge · other systems outside the subject |
| **Never mock the system under test** |
| **Avoid excessive mocking** — a test that mocks everything proves nothing |
| **Prefer realistic collaboration** inside the boundary that the layer claims to verify |
| Mocks must not redefine product ownership or invent F5 behaviour |
| Time · randomness · and network flakiness are controlled boundaries — not excuses for order-dependent suites |
| Contract tests prefer agreed schemas/dialects over hand-woven fake servers that drift from OpenAPI law |

---

# 16. Regression Philosophy

| Principle |
|-----------|
| **Regression tests protect constitutional behaviour.** |
| Once a constitutional journey · contract · Trust boundary · or Shared Destination rule is verified, silent breakage must fail the suite |
| Regressions track F5/F6 amendments — tests update when law amends, not when convenience prefers |
| Snapshot abuse is banned as a substitute for behavioural regression |
| Flaky “sometimes red” suites are not regression protection — they are defects |

---

# 17. Continuous Integration Gates

| Principle |
|-----------|
| **CI must fail on constitutional regressions.** |
| Gates prove organization health before merge (F6.1 §21): lint · type · unit · integration · contract · required a11y/security subsets · critical E2E as declared by subordinate CI policy |
| Green CI never means “product redesigned successfully in a PR” — product changes require F5 amendment first |
| Contract and Trust gates are not optional cosmetics |
| Parallelism and caching accelerate CI — they must not introduce hidden shared state across tests |
| Concrete pipeline YAML and commands are out of scope here |

---

# 18. Failure Philosophy

| Principle |
|-----------|
| A failing test is a signal about product law, engineering organization, or the suite itself — triage honestly |
| Prefer fixing the defect or amending the correct SSOT over deleting the test |
| Quarantine of flaky tests is temporary and owned — permanent mute is banned |
| False greens (tests that cannot fail when law breaks) are defects |
| Test environment failure must not corrupt durable shared data — isolation and teardown are architectural duties |
| Failure messages should orient engineers to ownership — not dump noise that hides the boundary |

---

# PART D — RULES · CLOSE

---

# 19. Dependency Rules

## 19.1 Allowed direction

```
Constitutional law (F5 · F6)
  → behaviours and boundaries to verify
    → appropriate test layer
      → approved tooling (stack) + shared testing capability
```

```
Contract tests
  ↔ API dialect / SDK ↔ Backend producer
```

## 19.2 Forbidden direction

| Forbidden |
|-----------|
| Tests defining product behaviour absent from F5 |
| Suites that require a sixth navigation root or forked Shared Destinations |
| Client-only suites claiming Trust enforcement complete |
| Mocks of the system under test |
| Production secrets or real player data as fixtures |
| CI greening by skipping constitutional gates |
| Performance or security “tests” that encode engagement manipulation as success |
| Version 2 surfaces validated into MVP by test scaffolding alone |

## 19.3 Ownership of suites

| Suite concern | Owner kinship |
|---------------|---------------|
| Domain / shared module behaviour | Same owner as the module (F6.2 · F6.3) |
| Contract dialect | Shared cross-boundary ownership (F6.4) |
| Design System component contracts | Design System governance + frontend stewardship |
| Critical journeys | Shared product-engineering ownership — journeys map to F5.3 |
| Security Trust boundaries | Platform security ownership with client reflection checks |

---

# 20. Anti-Patterns

| Banned |
|--------|
| Test code · framework examples · YAML · coverage % · commands · folder trees presented as this constitution |
| **Testing implementation instead of behaviour** |
| **Snapshot abuse** |
| **Brittle selectors** |
| **Hidden shared state** |
| **Order-dependent tests** |
| **Random timing** as designed flake |
| **Client-only security tests** treated as sufficient Trust proof |
| **Untested constitutional behaviour** left as permanent debt |
| Tests as Source of Truth for product meaning |
| E2E-only inverted pyramid |
| Mocking everything · mocking the subject under test |
| Encoding engagement manipulation as success criteria |
| Green CI while knowingly violating F5/F6 |
| Treating F6.8 as authority over F5 or F6.1–F6.7 |

---

# 21. Audit Checklist

- [ ] Defines how testing is organized — no test code · no configs · no YAML · no coverage % · no commands · no examples  
- [ ] Explicitly states immutable laws (§3.1): Trust · constitutions · tests ≠ product behaviour · F5/F6 truth · tests ≠ SSOT · testability · layers · a11y mandatory · CI fails on constitutional regressions  
- [ ] Pyramid and layers (unit · integration · contract · component · E2E · a11y · performance · security) defined as philosophy  
- [ ] Contract testing explicitly covers API SDK ↔ Backend  
- [ ] Test data · mock · regression · CI gate · failure philosophies explicit  
- [ ] Anti-patterns include implementation-testing · snapshot abuse · brittle selectors · shared state · order dependence · random timing · client-only security · untested constitutional behaviour  
- [ ] Compatible with F1–F5 and F6.1–F6.7 · `TECH_STACK_DECISIONS.md` · `CODING_STANDARDS.md` · `packages/testing`  
- [ ] Gate: stop — do not continue to F6.9 in this deliverable  

---

## Final gate

### DRAFT COMPLETE — pending LOCK

**Sprint F6.8 — Testing Architecture** delivered as **DRAFT**.

This document is the working SSOT candidate for **testing organization** under F1–F5 · F6.1–F6.7.

Stop.

Do **NOT** continue to Sprint F6.9 until F6.8 is explicitly advanced / LOCKED by Engineering Architecture Director.

---

## Related documents

| Doc | Role |
|-----|------|
| [`F6_1_ENGINEERING_ARCHITECTURE.md`](./F6_1_ENGINEERING_ARCHITECTURE.md) | Testing philosophy foundation · build gates |
| [`F6_2_FRONTEND_ARCHITECTURE.md`](./F6_2_FRONTEND_ARCHITECTURE.md) | Client surfaces and a11y under test |
| [`F6_3_BACKEND_ARCHITECTURE.md`](./F6_3_BACKEND_ARCHITECTURE.md) | Domain collaboration under test |
| [`F6_4_API_ARCHITECTURE.md`](./F6_4_API_ARCHITECTURE.md) | Contract dialect to protect |
| [`F6_5_DATA_ARCHITECTURE.md`](./F6_5_DATA_ARCHITECTURE.md) | Truth vs projection behaviours to protect |
| [`F6_6_REALTIME_BACKGROUND_JOBS_ARCHITECTURE.md`](./F6_6_REALTIME_BACKGROUND_JOBS_ARCHITECTURE.md) | Async idempotency and optional realtime |
| [`F6_7_SECURITY_ARCHITECTURE.md`](./F6_7_SECURITY_ARCHITECTURE.md) | Trust boundaries to validate |
| [`F5_3_SCREEN_SPECIFICATIONS.md`](../05_PRODUCT_ARCHITECTURE/F5_3_SCREEN_SPECIFICATIONS.md) | **LOCKED** journeys and screens |
| [`F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md) | **LOCKED** honest states |
| [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) | `packages/testing` · ownership of suites |
| [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) | Subordinate quality discipline |
| [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) | Approved test tooling — ADR governance |
| [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) | Supreme product question |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | DRAFT — Testing architecture: philosophy · principles · pyramid · unit/integration/contract/component/E2E/a11y/performance/security · test data · mocks · regression · CI gates · failure · dependencies; no code · no config · no coverage %; gate before F6.9 |
