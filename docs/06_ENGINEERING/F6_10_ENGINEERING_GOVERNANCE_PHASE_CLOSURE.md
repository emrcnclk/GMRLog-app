# GMRLOG — Sprint F6.10: Engineering Governance & Phase Closure

**Document:** `docs/06_ENGINEERING/F6_10_ENGINEERING_GOVERNANCE_PHASE_CLOSURE.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F6.10 (Engineering Governance & Phase Closure — constitutional closure only)  
**Last Updated:** July 2026  
**Owner:** Engineering Architecture Director  
**Classification:** Engineering Constitution

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
| 8 | [`F6_1_ENGINEERING_ARCHITECTURE.md`](./F6_1_ENGINEERING_ARCHITECTURE.md) — engineering organization |
| 9 | [`F6_2_FRONTEND_ARCHITECTURE.md`](./F6_2_FRONTEND_ARCHITECTURE.md) — frontend organization |
| 10 | [`F6_3_BACKEND_ARCHITECTURE.md`](./F6_3_BACKEND_ARCHITECTURE.md) — backend organization |
| 11 | [`F6_4_API_ARCHITECTURE.md`](./F6_4_API_ARCHITECTURE.md) — API exposure organization |
| 12 | [`F6_5_DATA_ARCHITECTURE.md`](./F6_5_DATA_ARCHITECTURE.md) — data organization |
| 13 | [`F6_6_REALTIME_BACKGROUND_JOBS_ARCHITECTURE.md`](./F6_6_REALTIME_BACKGROUND_JOBS_ARCHITECTURE.md) — realtime & jobs organization |
| 14 | [`F6_7_SECURITY_ARCHITECTURE.md`](./F6_7_SECURITY_ARCHITECTURE.md) — security organization |
| 15 | [`F6_8_TESTING_ARCHITECTURE.md`](./F6_8_TESTING_ARCHITECTURE.md) — testing organization |
| 16 | [`F6_9_INFRASTRUCTURE_DEVOPS_ARCHITECTURE.md`](./F6_9_INFRASTRUCTURE_DEVOPS_ARCHITECTURE.md) — infrastructure & DevOps organization (**LOCKED**) |
| 17 | [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) · [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) · [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) — subordinate engineering projections |
| 18 | **This document** — Engineering Governance & Phase Closure (constitutional freeze of Phase F6) |

Never contradict previous freezes.

Never redesign the product.

Never redesign UX or UI.

Never change Information Architecture.

Never invent MVP features.

Never redefine ownership.

This document is **not** another engineering architecture specification.

This document is the **constitutional closure of Engineering**.

| Layer | Role relative to this document |
|-------|--------------------------------|
| F1–F4 | Constitutional product · UX · UI law — frozen |
| F5 | Product Architecture — **LOCKED** / frozen |
| F6.1–F6.9 | Engineering Architecture series — organization law |
| **F6.10** | Governance · amendment · freeze · implementation readiness |

This sprint answers:

> “How is Engineering governed, frozen, and authorized for implementation?”

rather than:

> “How is another subsystem organized?” · “What should we build next?” · “How do we code it?”

| Does | Does not |
|------|----------|
| Define engineering governance · authority · ownership · freeze · amendments · ADR · debt · refactoring · integrity · consistency · review · audit · implementation readiness · phase closure | Implementation · code · examples · APIs · schemas · database · Docker · DevOps · algorithms · UI · UX · product redesign · new MVP features · Version 2 planning |

**Gate:** This is the final document of Phase F6. Do **not** create F6.11.

---

## Scope

**In scope:** Engineering governance · architecture authority · constitutional hierarchy · engineering ownership · architecture freeze · allowed amendments · forbidden modifications · document evolution · ADR philosophy · refactoring · technical debt · architecture integrity · cross-document consistency · review & approval · engineering audit · implementation readiness · Phase F6 closure · final freeze declaration.

**Out of scope:**

| Forbidden |
|-----------|
| Implementation · source code · examples |
| API catalogs · schemas · database design |
| Docker · DevOps configuration · infrastructure setup |
| Algorithms · UI · UX · product redesign |
| New MVP features · Version 2 planning |
| A new F6.x architecture series document |

---

## Deliverable map

| Part | §§ | Title |
|------|----|-------|
| A | 1–4 | Mission · Relationship · Governance Philosophy · Constitutional Hierarchy |
| B | 5–9 | Ownership · Authority · Amendment · What May Change · What May Never Change |
| C | 10–14 | ADR · Refactoring · Technical Debt · Integrity · Cross-document Consistency |
| D | 15–18 | Review & Approval · Audit · Implementation Readiness · Phase F6 Closure |
| E | 19–21 | Final Freeze Declaration · Anti-Patterns · Audit Checklist |

---

# PART A — FOUNDATION

---

# 1. Mission

Close Phase F6 permanently.

Freeze Engineering Architecture Version 1 as a coherent, governed constitution under F1–F5.

Authorize implementation that **follows** architecture — never the reverse.

| Prefer | Never |
|--------|-------|
| Governance over improvisation | Silent rewrites of frozen law |
| Amendments over new F6 documents | Parallel constitutions |
| Implementation under law | Law rewritten by code convenience |
| Integrity across F6.1–F6.9 | Local exceptions that fork ownership |
| Clarity of what may never change | “Temporary” constitutional holes |

---

# 2. Relationship to Previous Constitutions

| Prior law | Governance obligation |
|-----------|------------------------|
| North Star · Master | Engineering remains a projection — never supreme product meaning |
| F1–F4 | UX · UI · product philosophy remain frozen — F6 never reopens them |
| F5.1–F5.5 | **Product Architecture is frozen.** Ownership · IA · screens · behaviour · implementation rules remain LOCKED; F6 never redefines them |
| F6.1 | Organization of software — governed, not reinvented by delivery pressure |
| F6.2 | Frontend organization — implementation must obey; may not invent IA |
| F6.3 | Backend organization — domains remain ownership-aligned |
| F6.4 | API exposure dialect — infrastructure and code may not rewrite contracts by stealth |
| F6.5 | Data ownership · projections · external data subordination |
| F6.6 | Realtime/jobs as consequences — not product domains |
| F6.7 | Trust · secrets · authn/authz — operational convenience never overrides |
| F6.8 | Tests verify constitutions — CI fails on constitutional regressions |
| F6.9 | Infrastructure serves product — replaceable · cloud-agnostic apps · LOCKED ops philosophy |
| `TECH_STACK_DECISIONS.md` | Stack changes require ADR — never silent substitution |
| `MONOREPO_STRUCTURE.md` · `CODING_STANDARDS.md` | Subordinate projections under F6 — amend with governance, not folklore |

On conflict: higher law wins. Implementation never wins over constitution.

---

# 3. Engineering Governance Philosophy

## 3.1 Immutable governance laws

| Law |
|-----|
| **Product Architecture is frozen.** |
| **Engineering Architecture is frozen.** |
| **Product ownership never changes** without F5 Amendment. |
| **Shared Destinations remain singular.** |
| **Information Architecture remains frozen.** |
| **UX philosophy remains frozen.** |
| **UI philosophy remains frozen.** |
| **Engineering documents are constitutional.** |
| **Implementation follows architecture.** |
| **Architecture never follows implementation.** |
| **Refactoring may improve implementation.** |
| **Refactoring must never rewrite architecture.** |
| **Technical debt may justify implementation changes.** |
| **Technical debt never justifies constitutional changes.** |
| **Architecture changes require Amendments.** |
| **No new F6 constitutional documents may be created.** |
| **Version 1 Engineering Architecture is complete.** |
| **Implementation is now authorized.** |

## 3.2 Preference order

1. Constitutional obedience (F1–F5 · F6.1–F6.9 · this closure)
2. Trust (F6.7)
3. Ownership clarity (F5.1)
4. Cross-document integrity
5. Implementation quality under law
6. Delivery speed

---

# 4. Constitutional Hierarchy

```
NORTH STAR
  → Master Product & Design Direction
    → F1–F4 constitutions (product · UX · UI)
      → F5 Product Architecture (LOCKED · frozen)
        → F6.1–F6.9 Engineering Architecture (organization)
          → F6.10 Engineering Governance & Phase Closure (this document)
            → Subordinate projections (MONOREPO · CODING_STANDARDS · TECH_STACK · ADRs)
              → Implementation (code · pipelines · runtime)
```

| Rule |
|------|
| Lower layers obey higher layers |
| Implementation is the lowest layer — never an author of law |
| Subordinate projections may detail; they may not contradict |
| An ADR may choose among allowed technical means; it may not amend F5/F6 by stealth |

---

# PART B — OWNERSHIP · AUTHORITY · CHANGE

---

# 5. Engineering Ownership

| Area | Owner kinship |
|------|---------------|
| Engineering Architecture series (F6.1–F6.10) | Engineering Architecture Director |
| Product Architecture (F5) | Product Architecture Director — F6 may not amend F5 alone |
| Frontend organization obedience (F6.2) | Frontend team under F6.2 |
| Backend / platform obedience (F6.3–F6.6) | Backend / platform team under F6.3–F6.6 |
| Security obedience (F6.7) | Platform security ownership |
| Testing gates (F6.8) | Shared engineering — CI ownership with domain suite owners |
| Infrastructure / DevOps (F6.9) | Platform / DevOps under F6.9 |
| Cross-boundary contracts (F6.4) | Shared review — frontend and backend together |
| Design System packages | F4.12 governance + frontend stewardship — F6 does not fork UI law |

| Ownership law |
|---------------|
| Every module and package retains the ownership map of F5.1 / F6.1–F6.3 |
| Orphan constitutional documents are illegal |
| Ownership of code does not grant ownership of product meaning |

---

# 6. Architecture Authority

| Authority | May |
|-----------|-----|
| F5 | Define what exists · ownership · behaviour · MVP scope |
| F6.1–F6.9 | Define how engineering is organized for Version 1 |
| F6.10 | Freeze Engineering · govern amendments · authorize implementation |
| ADR | Record stack/technique decisions under `TECH_STACK_DECISIONS.md` governance |
| Implementation | Realize law in code — never redefine law |

| Authority never |
|-----------------|
| Lets a PR rewrite F5.1 ownership “because the folder was easier” |
| Lets infrastructure invent API dialect |
| Lets tests invent product behaviour |
| Lets Version 2 planning reopen F6 as a new series inside Version 1 |

---

# 7. Amendment Philosophy

| Principle |
|-----------|
| **Architecture changes require Amendments.** |
| An Amendment modifies an existing LOCKED document — it does not create F6.11 |
| Amendments must state: what changes · why · which higher law still holds · what does not change |
| Product meaning changes require F1–F5 Amendment first — F6 alone is insufficient |
| Engineering organization changes require Amendment to the relevant F6.1–F6.9 document · then acknowledgment under this closure |
| Silent edits that alter constitutional meaning without Amendment metadata are illegal |
| Version bumps and Revision History entries are mandatory for Amendments |

---

# 8. What May Change

| May change (under governance) | How |
|-------------------------------|-----|
| Implementation code · modules · refactors | Obey F5–F6 · no constitutional rewrite |
| Subordinate projections (tooling detail · CI wiring · runbooks) | Must not contradict F6.1–F6.9 |
| Stack choices within ADR policy | `TECH_STACK_DECISIONS.md` + ADR — not silent |
| Additive API evolution inside F6.4 dialect | Amendment/contract process — not breaking stealth |
| Projection rebuilds · operational topology that remains replaceable | F6.5 · F6.9 — must not change product meaning |
| Test suites that enforce the same law better | F6.8 — tests still do not define product |
| Document clarifications that do not change meaning | Prefer Amendment when meaning could be disputed |

---

# 9. What May Never Change

| May never change (without higher Amendment) |
|-----------------------------------------------|
| Product ownership map (F5.1) |
| Shared Destination singularity |
| Frozen Information Architecture / five player roots |
| UX philosophy (F3) · UI philosophy (F4) |
| MVP scope boundary vs Version 2 (F5.5 §20.1 · F2.29) |
| Backend as durable Trust authority · frontend as non-authoritative business security |
| Database as authoritative store · search/cache as projections |
| API as projection of ownership — not inventor of rooms |
| Engineering Architecture Version 1 freeze itself — except by Amendment to LOCKED docs |
| The ban on new F6 constitutional documents |

---

# PART C — EVOLUTION UNDER FREEZE

---

# 10. ADR Philosophy

| Principle |
|-----------|
| Architecture Decision Records capture **technical means** under approved governance — not product redesign |
| ADRs are subordinate to F5 and F6 — an ADR that contradicts them is void |
| Use ADRs for stack substitutions · library admissions · operational substrate choices that preserve cloud-agnostic application meaning (F6.9) |
| ADRs must record rejected alternatives and Trust impact when relevant (F6.7) |
| ADRs never replace Amendments when constitutional text must change |
| Undocumented standing decisions that act like law are debt — promote to ADR or Amendment |

---

# 11. Refactoring Philosophy

| Principle |
|-----------|
| **Refactoring may improve implementation.** |
| **Refactoring must never rewrite architecture.** |
| Allowed: clarity · performance within promises · module boundaries that better mirror existing ownership · removing duplication under Design System / package law |
| Forbidden: new tabs · new Shared Destination forks · new API universes · Trust moved to the client · Version 2 scaffolds under MVP names |
| Refactors require tests that still enforce constitutions (F6.8) |
| “While we’re here” product changes are not refactors — they require product Amendment |

---

# 12. Technical Debt Philosophy

| Principle |
|-----------|
| **Technical debt may justify implementation changes.** |
| **Technical debt never justifies constitutional changes.** |
| Debt is tracked · owned · and paid under law — not used as a license to violate F5.1 |
| “Temporary” folders that become parallel architecture remain banned (F6.1) |
| Skipping CI constitutional gates is not an acceptable debt instrument (F6.8 · F6.9) |
| Debt repayment that needs new product meaning must wait for product Amendment |

---

# 13. Architecture Integrity Rules

| Rule |
|------|
| Every player-facing surface maps to F5.3 (or Amendment) |
| Every durable entity has one owner and one canonical identity (F6.5) |
| Shared Destinations remain singular in modules · APIs · data · jobs |
| Guest integrations remain guests (Steam · Discord) |
| Secrets never leave the backend · never live in repositories |
| Projections remain disposable and rebuildable |
| Realtime remains optional for correctness |
| Infrastructure remains replaceable · applications cloud-agnostic |
| No sixth player root · no Version 2 under MVP naming |

---

# 14. Cross-document Consistency

| Principle |
|-----------|
| F6.1–F6.9 must be read as one Engineering Architecture — not as competing pamphlets |
| On apparent conflict inside F6: prefer the more specific document for its subject · never prefer convenience · escalate to Amendment if meaning is truly ambiguous |
| F6 never “wins” against F5 |
| Subordinate docs (`MONOREPO_STRUCTURE.md` · `CODING_STANDARDS.md` · `TECH_STACK_DECISIONS.md`) must be kept consistent or amended — code comments are not a third constitution |
| Amendments must check kinship across FE · BE · API · data · jobs · security · tests · infra |

---

# PART D — REVIEW · AUDIT · READINESS · CLOSURE

---

# 15. Review & Approval Process

| Change type | Required review |
|-------------|-----------------|
| Implementation PR | Ordinary engineering review + CI constitutional gates |
| Cross-boundary contract change | Frontend + backend shared review (F6.4) |
| Security-sensitive change | Security/platform review (F6.7) |
| Infrastructure / secrets / production delivery | DevOps/platform review (F6.9 · F6.7) |
| ADR | Architecture review under stack governance |
| F6 Amendment | Engineering Architecture Director (+ Product Architecture Director if product meaning touched) |
| F5 Amendment | Product Architecture authority — out of F6’s sole power |

| Review law |
|------------|
| Approval does not legalize constitutional contradiction |
| “Ship now, amend later” for frozen law is forbidden |

---

# 16. Engineering Audit

| Audit question |
|----------------|
| Does this change obey F5 ownership and MVP scope? |
| Does this change obey the relevant F6.1–F6.9 subject law? |
| Does this invent IA · UX · UI · API dialect · or Version 2 scaffolding? |
| Are Trust · secrets · and authoritative data boundaries intact? |
| Are projections still disposable · jobs still non-owners · realtime still optional for correctness? |
| Do tests and CI still enforce the constitution? |
| Is documentation amended when meaning changes — or is folklore accumulating? |

Periodic audits may be scheduled operationally — they do not reopen Phase F6 as a writing sprint.

---

# 17. Implementation Readiness

## 17.1 Authorization

**Version 1 implementation may begin.**

Implementation is now the active phase of the project for Engineering Version 1.

## 17.2 Obedience

Implementation teams must obey:

| Layer |
|-------|
| F1 |
| F2 |
| F3 |
| F4 |
| F5 |
| F6 (F6.1–F6.10) |

**No implementation decision may contradict them.**

## 17.3 Readiness laws

| Law |
|-----|
| Build only cataloged F5.3 surfaces (or Amendments) |
| Reuse Design System and packages — no private kits (F5.5 · F6.2) |
| Call platform through shared API SDK dialect (F6.4) |
| Keep durable truth on the backend (F6.5 · F6.7) |
| Treat guests as optional (F2.21 · F6.5 §4.1) |
| Fail CI on constitutional regressions (F6.8) |
| Deploy through governed environments and Release Candidates (F6.9) |

---

# 18. Phase F6 Closure

| Closure fact |
|--------------|
| Phase F6 Engineering Architecture series is complete for Version 1 |
| F6.1–F6.9 define organization; F6.10 freezes and governs |
| **No new F6 constitutional documents may be created** |
| Future engineering evolution occurs only through **Amendments** to existing LOCKED documents (and ADRs where appropriate) |
| Product evolution remains under F5 Amendment rules — F6 does not reopen F5 |
| Version 2 remains future-reserved — not an F6.11 writing project inside Version 1 |

---

# PART E — FREEZE · CLOSE

---

# 19. Final Freeze Declaration

Phase F6 is permanently frozen.

Engineering Architecture Version 1 is complete.

Product Architecture remains frozen (F5).

Information Architecture remains frozen.

UX philosophy remains frozen.

UI philosophy remains frozen.

Shared Destinations remain singular.

Product ownership never changes without Amendment.

Engineering documents are constitutional.

Implementation follows architecture.

Architecture never follows implementation.

Future engineering evolution must occur only through constitutional Amendments.

No architectural document may be rewritten after this point without Amendment governance.

No new constitutional Infrastructure or Engineering series document may be created inside Phase F6.

Implementation becomes the active phase of the project.

Version 1 implementation is authorized under F1–F6.

---

# 20. Anti-Patterns

| Banned |
|--------|
| Creating F6.11 or any new F6 constitutional architecture document |
| Rewriting F6.1–F6.9 in place without Amendment metadata |
| Letting implementation redefine ownership · IA · API dialect · Trust authority |
| Using technical debt or refactoring as a license for constitutional change |
| ADRs that silently amend F5/F6 |
| Version 2 planning disguised as “engineering cleanup” under MVP |
| Parallel wiki constitutions that diverge from `docs/` SSOT |
| Shipping by skipping F6.8 gates or F6.9 Release Candidate progression |
| Treating this closure as optional commentary |

---

# 21. Audit Checklist

- [ ] Declares Phase F6 permanently frozen · Engineering Architecture Version 1 complete  
- [ ] Status LOCKED · no F6.11  
- [ ] Governance laws explicit: implementation follows architecture · amendments required · debt/refactor limits  
- [ ] Hierarchy places F6.10 after F6.1–F6.9 and under F5  
- [ ] What may change / may never change explicit  
- [ ] ADR · refactoring · technical debt · integrity · consistency · review · audit defined  
- [ ] Implementation readiness authorizes Version 1 work under F1–F6  
- [ ] Final Freeze Declaration present and unambiguous  
- [ ] No implementation · code · APIs · schemas · Docker · DevOps · UI/UX redesign · Version 2 planning  

---

## Final gate

### LOCKED — Phase F6 closed

**Sprint F6.10 — Engineering Governance & Phase Closure** is **LOCKED** at Version 1.0.

Phase F6 is permanently frozen.

Engineering Architecture Version 1 is complete.

Implementation is authorized.

Do **NOT** create Sprint F6.11.

---

## Related documents

| Doc | Role |
|-----|------|
| [`F6_1_ENGINEERING_ARCHITECTURE.md`](./F6_1_ENGINEERING_ARCHITECTURE.md) | Engineering organization |
| [`F6_2_FRONTEND_ARCHITECTURE.md`](./F6_2_FRONTEND_ARCHITECTURE.md) | Frontend organization |
| [`F6_3_BACKEND_ARCHITECTURE.md`](./F6_3_BACKEND_ARCHITECTURE.md) | Backend organization |
| [`F6_4_API_ARCHITECTURE.md`](./F6_4_API_ARCHITECTURE.md) | API organization |
| [`F6_5_DATA_ARCHITECTURE.md`](./F6_5_DATA_ARCHITECTURE.md) | Data organization |
| [`F6_6_REALTIME_BACKGROUND_JOBS_ARCHITECTURE.md`](./F6_6_REALTIME_BACKGROUND_JOBS_ARCHITECTURE.md) | Realtime & jobs organization |
| [`F6_7_SECURITY_ARCHITECTURE.md`](./F6_7_SECURITY_ARCHITECTURE.md) | Security organization |
| [`F6_8_TESTING_ARCHITECTURE.md`](./F6_8_TESTING_ARCHITECTURE.md) | Testing organization |
| [`F6_9_INFRASTRUCTURE_DEVOPS_ARCHITECTURE.md`](./F6_9_INFRASTRUCTURE_DEVOPS_ARCHITECTURE.md) | Infrastructure & DevOps organization (**LOCKED**) |
| [`F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md`](../05_PRODUCT_ARCHITECTURE/F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md) | Product Architecture Freeze kinship |
| [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) | ADR / stack governance |
| [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) | Subordinate monorepo projection |
| [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) | Subordinate coding discipline |
| [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) | Supreme product question |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | **LOCKED** — Engineering Governance & Phase Closure: freezes Phase F6 · Version 1 Engineering Architecture complete · amendment/ADR/debt/refactor rules · implementation authorized under F1–F6 · no F6.11 |
