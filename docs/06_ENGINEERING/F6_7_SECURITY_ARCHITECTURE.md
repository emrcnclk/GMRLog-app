# GMRLOG — Sprint F6.7: Security Architecture

**Document:** `docs/06_ENGINEERING/F6_7_SECURITY_ARCHITECTURE.md`  
**Version:** 1.0  
**Status:** **DRAFT**  
**Sprint:** F6.7 (Security Architecture — organization of Trust protection only)  
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
| 8 | [`F6_1_ENGINEERING_ARCHITECTURE.md`](./F6_1_ENGINEERING_ARCHITECTURE.md) — engineering organization · security principles |
| 9 | [`F6_2_FRONTEND_ARCHITECTURE.md`](./F6_2_FRONTEND_ARCHITECTURE.md) — client reflects Trust · never sole gate |
| 10 | [`F6_3_BACKEND_ARCHITECTURE.md`](./F6_3_BACKEND_ARCHITECTURE.md) — platform authn/authz boundaries · Trust home |
| 11 | [`F6_4_API_ARCHITECTURE.md`](./F6_4_API_ARCHITECTURE.md) — surface authn/authz · rate limiting · access outcomes |
| 12 | [`F6_5_DATA_ARCHITECTURE.md`](./F6_5_DATA_ARCHITECTURE.md) — durable truth · sensitive data ownership · audit history |
| 13 | [`F6_6_REALTIME_BACKGROUND_JOBS_ARCHITECTURE.md`](./F6_6_REALTIME_BACKGROUND_JOBS_ARCHITECTURE.md) — realtime/job Trust · workers not a bypass |
| 14 | [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) · [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) · [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) — subordinate engineering projections |
| 15 | **This document** — Security Architecture Specification (how security is organized) |

Never contradict previous freezes.

Never redesign the product.

Never redesign UX or UI.

Never change Information Architecture.

Never invent MVP features.

Never redefine ownership — **all ownership comes from F5.1**.

This sprint specifies **HOW security is organized**.

| Layer | Role relative to this document |
|-------|--------------------------------|
| F1–F4 | Constitutional product · UX · UI · Trust / privacy kinship |
| F5 | What exists · ownership · behavior — **LOCKED** |
| F6.1–F6.6 | Engineering organization · client · platform · API · data · async Trust boundaries |
| **F6.7** | How **security responsibilities** bind those layers into one Trust architecture |

This sprint answers:

> “How is security organized?”

rather than:

> “How is auth coded?” · “What is the JWT shape?” · “How is encryption configured?”

| Does | Does not |
|------|----------|
| Define security · Trust · authentication · authorization · identity · session · permission · privacy · sensitive data · secrets · integration security · rate limiting · abuse prevention · audit logging · incident philosophies · dependency rules | JWT payloads · OAuth flows · encryption algorithms · middleware · secrets values · cloud configuration · infrastructure · code · product redesign |

**Stack note:** Authentication and related technologies are taken only from `TECH_STACK_DECISIONS.md` (JWT access/refresh kinship · OAuth providers as guests · Helmet · rate limiting · secure cookie kinship · etc.). This document organizes responsibilities. It does **not** re-select the stack, invent technologies, or implement them. Stack changes require ADR.

**Gate:** Stop after this specification. Do **not** continue to Sprint F6.8 in this deliverable.

---

## Scope

**In scope:** Mission · relationship to prior constitutions · security philosophy · Trust philosophy · authentication · authorization · identity · session · permission · privacy · sensitive data · secret management · integration security · rate limiting · abuse prevention · audit logging · incident philosophy · dependency rules.

**Out of scope:**

| Forbidden |
|-----------|
| JWT payload schemas · token implementation · signing code |
| OAuth flow diagrams as implementation · provider SDK wiring |
| Encryption algorithm selection tutorials · key rotation runbooks as ops manuals |
| Middleware source · Nest guards as code |
| Secret values · `.env` contents · vault configuration |
| Cloud IAM · WAF rules · infrastructure topology |
| Product · UX · UI · IA redesign · new MVP features |

---

## Deliverable map

| Part | §§ | Title |
|------|----|-------|
| A | 1–4 | Mission · Relationship · Security Philosophy · Trust Philosophy |
| B | 5–9 | Authentication · Authorization · Identity · Session · Permission |
| C | 10–13 | Privacy · Sensitive Data · Secret Management · Integration Security |
| D | 14–17 | Rate Limiting · Abuse Prevention · Audit Logging · Incident Philosophy |
| E | 18–20 | Dependency Rules · Anti-Patterns · Audit Checklist |

---

# PART A — FOUNDATION

---

# 1. Mission

Define the security organization that every future auth, access, privacy, and incident decision must obey.

Security is not a feature layer bolted on after shipping. Security is the architectural protection of **Trust** inside the Digital Home.

| Prefer | Never |
|--------|-------|
| Trust over convenience | Shortcuts that weaken authoritative gates |
| Platform enforcement | Client-only “security” theater |
| Least privilege · default deny | Ambient permission sprawl |
| Honest safe failure | Silent corruption · engagement coercion disguised as safety |
| Guest integrations as guests | External providers as identity authorities |

---

# 2. Relationship to Previous Constitutions

| Prior law | Security obligation |
|-----------|---------------------|
| F2.20 · F2.27 · F2.21 | Privacy · consent · Trust · optional integrations — engineering defaults, not optional polish |
| F2.2 · F5.1 gate stratum | Auth / onboarding as gate — not a sixth player root · Connected Accounts optional |
| F3 · F5.4 | Failures are calm and honest — no guilt · no trapping OAuth · no dark patterns as “security UX” |
| F5.1 | Permissions follow ownership — Shared Destinations singular · staff isolated |
| F5.5 §20.1 | Version 2 security products (e.g. public API threat surface) receive no MVP scaffolding under MVP names |
| F6.1 §18 | Secure by default · never trust client input · secrets never in clients · staff powers isolated |
| F6.2 | Clients hide affordances; they are never the only gate · forms courtesy-validate only |
| F6.3 §13–§14 · §17 | Authn vs authz boundaries · platform enforcement · Trust-aligned security |
| F6.4 §17–§19 | Identity classes · access outcomes · rate limiting as honest protection |
| F6.5 | Sensitive data one owner · audit history philosophy · external data subordinate |
| F6.6 | Workers/realtime are not Trust bypasses · optional connection · job authz |

On conflict, the higher law wins. Security convenience never overrides F5.1 ownership or Trust.

---

# 3. Security Philosophy

## 3.1 Immutable security laws

| Law |
|-----|
| **Security protects Trust.** |
| **Trust always overrides convenience.** |
| **Backend remains authoritative.** |
| **Frontend never enforces business security.** |
| **Every request must be treated independently.** |
| **Authentication identifies.** |
| **Authorization grants permissions.** |
| **Validation is not authorization.** |
| **Rate limiting protects infrastructure, never manipulates users.** |
| **External providers (Steam, Discord) never become identity authorities.** |
| **Secrets never leave the backend.** |
| **Sensitive data has exactly one owner.** |
| **Least privilege by default.** |
| **Default deny when authorization is uncertain.** |
| **Audit logs explain important security actions but never become product features.** |
| **Security failures must fail safely.** |

## 3.2 Security meaning

| Is | Is not |
|----|--------|
| Architectural default across edge · domain · data · jobs · realtime | A single middleware file that “does security” |
| Protection of Digital Home · privacy · consent · ownership | Surveillance theater · retention coercion |
| Honest denial and safe failure | Fake not-found used to manipulate (outside documented privacy policy — F6.4) |
| Least privilege for players · staff · workers · guests | Ambient admin in player paths |

## 3.3 Preference order

1. Trust and constitutional obedience (F1–F5 · F6.1–F6.6)
2. Authoritative platform enforcement
3. Least privilege · default deny
4. Safe failure and observability
5. Simplicity of security boundaries
6. Delivery speed

---

# 4. Trust Philosophy

| Principle |
|-----------|
| Trust is product law projected into engineering — players must believe GMRLOG will not manipulate, leak, or silently redefine their home |
| Trust decisions (permissions · ownership mutations · identity changes · linking · import confirmation) are platform-confirmed |
| Soft-gates are honest product access — not bait-and-switch security |
| Staff Trust powers are isolated and auditable |
| Trust never licenses dark patterns “for the user’s safety” |
| Offline / pending client state is never treated as confirmed Trust (F6.2 · F6.5) |

---

# PART B — IDENTITY · ACCESS

---

# 5. Authentication Philosophy

| Principle |
|-----------|
| **Authentication identifies.** It answers: who is speaking? |
| Identity attachment happens at the platform edge before protected meaning (F6.3 §13 · F6.4 §17) |
| Identity classes (philosophy): anonymous guest · authenticated player · staff — same classes across HTTP and realtime (F6.6 §18) |
| Session / token mechanics are organized behind this boundary — this document does not define JWT payloads or OAuth implementation |
| **Every request must be treated independently** — prior client UI state is not proof of identity |
| Failed authentication is an explicit category outcome — safe, non-leaky, non-shaming |
| Optional Connected Accounts authenticate **linking**, not platform foundation identity (§13) |

---

# 6. Authorization Philosophy

| Principle |
|-----------|
| **Authorization grants permissions.** It answers: may this subject perform this action on this resource? |
| Authz is resource-aware: subject × action × resource under owning-domain policy (F6.3 §14 · F6.4 §18) |
| **Validation is not authorization** — a well-shaped request may still be denied |
| **Default deny when authorization is uncertain** |
| **Least privilege by default** — grant only what product law requires |
| Clients may hide affordances; **Frontend never enforces business security** as the authoritative gate |
| Staff permissions exist only on staff surfaces — never ambient in player domains |
| Workers and jobs re-check authorization for privileged work — queues are not a Trust bypass (F6.6 §20) |

---

# 7. Identity Philosophy

| Principle |
|-----------|
| GMRLOG identity is platform-owned — one player home identity under product law |
| Canonical identity for durable entities remains singular (F6.5 §7.1) — security references that identity, it does not invent parallel personhood stores |
| **External providers (Steam, Discord) never become identity authorities** — they are guest link providers (F2.21 · F6.5 §4.1) |
| Guest absence is normal — Digital Home works without them |
| Staff identity is a distinct class — not a player with hidden flags sprinkled through player tables as lifestyle |
| Soft-deleted or banned identity states are honest policy outcomes — not engagement shame theater |

---

# 8. Session Philosophy

| Principle |
|-----------|
| Sessions represent authenticated continuity — not product destinations |
| Session authority lives on the platform — client storage of session material is capability, not Trust source |
| Session lifecycle (establish · refresh · revoke · expire) is organized for safe failure — stolen or stale sessions fail closed |
| Realtime connections bind to the same session/identity class philosophy (F6.6 §18) — disconnect does not invent anonymous privilege |
| Logout / revoke must invalidate continuity honestly across surfaces in philosophy — no zombie Trust |
| Session design never traps players in non-cancellable flows (F5.4 kinship for link/import tasks) |

This document does not define cookie flags, token TTLs, or storage keys.

---

# 9. Permission Philosophy

| Principle |
|-----------|
| Permissions derive from product ownership and roles — F5.1 homes · community membership · library ownership · staff isolation |
| Permission checks live near owning domains — not as an undocumented global switchboard (F6.3 §14) |
| Soft-gates express product-allowed guest capability — still authorized outcomes, not missing checks |
| Capability grants are explicit — ambient “authenticated ⇒ everything” is banned |
| Permission changes are authoritative platform events — clients reflect them after confirmation |
| Permissions never encode streak pressure, FOMO access, or engagement coercion |

---

# PART C — PRIVACY · DATA · SECRETS · GUESTS

---

# 10. Privacy Philosophy

| Principle |
|-----------|
| Privacy is constitutional (F2.20 · F2.27 kinship) — consent, minimization, purpose limitation as architecture |
| Visibility of Shared Destinations and profile meaning follows owning-domain policy — not accidental join leakage |
| Analytics and logs minimize PII — measurement never becomes surveillance theater (F6.5 §14.1 · §17) |
| Export / deletion / disconnect of guest links respect product and privacy law — absence is normal |
| Privacy-motivated indistinguishability (where product documents it) is policy — not ad-hoc manipulation (F6.4 §12) |
| Security UX remains calm and non-guilt — F3 anti-manipulation applies |

---

# 11. Sensitive Data Philosophy

| Principle |
|-----------|
| **Sensitive data has exactly one owner** — ownership mirrors F5.1 / F6.5 domain ownership |
| Credentials · tokens · private archive fields · consent records · staff investigation notes are sensitive by class |
| Sensitive fields are not copied into search, cache, analytics, or realtime payloads without an explicit owning-domain rule |
| Projections that must not carry sensitive meaning omit it — rebuildable projections still obey minimization (F6.5 §10.1) |
| Client drafts may hold temporary sensitive input — never as durable authoritative store |
| Cross-domain reads of sensitive data require declared contracts and authorization — never convenience joins |

---

# 12. Secret Management Philosophy

| Principle |
|-----------|
| **Secrets never leave the backend.** |
| Secrets never live in clients · mobile binaries · web bundles · docs samples as real values · source control as standing truth |
| Secret material is injected through sealed configuration boundaries — apps consume capabilities, not raw sprawl |
| Rotation and revocation are expected lifecycle events — architecture must tolerate them without product IA changes |
| Job payloads and logs must not become secret exfiltration channels (F6.6 §20) |
| Guest provider secrets stay in adapter/platform boundary — never embedded for clients to “finish OAuth themselves” as Trust design |

This document does not define vault products, secret values, or cloud secret stores.

---

# 13. Integration Security Philosophy

| Principle |
|-----------|
| Steam · Discord (and future guests) are **guest data/providers** — enrich, never redefine ownership or identity authority (F6.5 §4.1) |
| Linking requires explicit consent and honest scope (F2.21 · F6.1 §18) |
| Import / OAuth tasks are cancellable and non-trapping (F5.4 · F6.4) |
| Callbacks are adapter-owned, verified, minimal — guests never gain player-API powers (F6.4 §21) |
| Integration failure or disconnect fails safely into absence — never into privilege escalation or identity foundation collapse |
| Integration jobs carry least privilege and optional-guest retry law (F6.6 §14) |

---

# PART D — ABUSE · ACCOUNTABILITY · RESPONSE

---

# 14. Rate Limiting Philosophy

| Principle |
|-----------|
| **Rate limiting protects infrastructure, never manipulates users.** |
| Class-based limits (identity class · surface sensitivity · read vs write) — one governed policy (F6.4 §19) |
| Outcomes are honest contract errors with recovery — never silent punishment theater or engagement throttling |
| Trust-sensitive surfaces (auth attempts · linking · report) carry stricter classes by policy |
| Limits are observable — operators see pressure before the home hurts |
| Concrete thresholds live in subordinate policy — not folklore in feature code |

---

# 15. Abuse Prevention Philosophy

| Principle |
|-----------|
| Abuse prevention protects players and infrastructure — spam · credential stuffing · scraping · harassment vectors — without becoming a second product of fear |
| Report / moderation capabilities remain staff-isolated and product-owned (F5.1 staff overlay) |
| Automated defenses fail safely — prefer temporary friction over silent data corruption |
| Abuse signals may inform rate classes and staff tooling — they must not invent engagement manipulation or guilt UX |
| Soft-delete / ban / restrict are policy outcomes under Trust — not public shame features |
| Prevention never justifies dark patterns |

---

# 16. Audit Logging Philosophy

| Principle |
|-----------|
| **Audit logs explain important security actions but never become product features.** |
| Security-relevant actions (authn outcomes of consequence · permission changes · linking · staff actions · sensitive reads where policy requires) are accountable (F6.5 §17 kinship) |
| Audit is append-oriented in philosophy — not a playground for rewriting history |
| Logs are for operators and Trust accountability — not player-facing feeds, not engagement metrics |
| Minimization applies — enough to be accountable, not everything by default |
| Audit availability must not become a product dependency that blocks ordinary play when secondary systems lag |

---

# 17. Incident Philosophy

| Principle |
|-----------|
| **Security failures must fail safely.** |
| Prefer deny / revoke / isolate over leaving uncertain privilege open |
| Incidents are operational responses — contain · assess · remediate · learn — they do not redesign IA mid-fire |
| Session revocation · secret rotation · guest disconnect are first-class safe actions |
| Communication to players (if any) remains honest and calm — no panic theater · no guilt |
| Post-incident changes amend architecture or policy deliberately — no silent permanent forks |
| Incident tooling is staff/ops — never a player engagement surface |

---

# PART E — DEPENDENCIES · CLOSE

---

# 18. Dependency Rules

## 18.1 Allowed direction

```
Request / connection / job
  → Authentication (identify)
    → Validation (shape — not permission)
      → Authorization (permit or default deny)
        → Owning domain use case
          → Durable truth (backend authoritative)
```

```
Client
  → reflects affordances and outcomes
  → never authoritative business security
```

```
Guest providers
  → adapter boundary only
  → never identity authority
```

## 18.2 Forbidden direction

| Forbidden |
|-----------|
| Frontend as authoritative business security gate |
| Validation treated as authorization |
| Guest provider (Steam · Discord) as identity authority |
| Secrets flowing to clients · logs · docs as real values |
| Workers / realtime bypassing authz |
| Analytics or audit systems owning product permissions |
| Sensitive data dual-owned or copied into projections without rule |
| Security middleware inventing product destinations or Version 2 surfaces |

## 18.3 Package boundaries

| Package / area | Security role |
|----------------|---------------|
| `packages/auth` | Session/capability helpers — platform remains authoritative for Trust decisions |
| `packages/validators` | Shape honesty — not permission |
| `packages/database` | Durable access under domain authz — not a backdoor |
| Client UI packages | Presentation only — no secret or policy authority |
| Staff modules | Isolated elevated Trust |

---

# 19. Anti-Patterns

| Banned |
|--------|
| JWT/OAuth/encryption/middleware/secret/infrastructure implementation inside this constitution’s spirit as “temporary code docs” |
| Trust sacrificed for convenience · client-only business security |
| Treating validation as authorization · ambient authenticated privilege |
| Default allow when uncertain |
| Steam/Discord as identity foundations or social authority |
| Secrets in clients · repos · job payloads · realtime messages |
| Rate limiting as user manipulation or engagement throttle |
| Audit logs as player product features or vanity feeds |
| Security failures that leave privilege open (“fail open”) |
| Fake security UX: trapping flows · guilt · FOMO lockdown theater |
| Dual ownership of sensitive data |
| Version 2 public-API threat surface scaffolding under MVP |
| Treating F6.7 as authority over F5.1 or F6.1–F6.6 |

---

# 20. Audit Checklist

- [ ] Defines how security is organized — no JWT payloads · no OAuth flows · no encryption algorithms · no secrets · no infra · no code  
- [ ] Explicitly states all immutable laws in §3.1 (Trust · convenience · backend authority · frontend non-enforcement · independent requests · authn vs authz · validation ≠ authz · rate limiting · external providers · secrets · sensitive data ownership · least privilege · default deny · audit ≠ product · fail safely)  
- [ ] Trust · authentication · authorization · identity · session · permission philosophies align with F6.3–F6.6  
- [ ] Privacy · sensitive data · secrets · integration security explicit and guest-safe  
- [ ] Rate limiting · abuse prevention · audit logging · incident philosophies explicit and non-manipulative  
- [ ] Dependency rules forbid client authority · guest identity authority · secret leakage · worker bypass  
- [ ] No new technologies beyond `TECH_STACK_DECISIONS.md`  
- [ ] Compatible with F1–F5 and F6.1–F6.6  
- [ ] Gate: stop — do not continue to F6.8 in this deliverable  

---

## Final gate

### DRAFT COMPLETE — pending LOCK

**Sprint F6.7 — Security Architecture** delivered as **DRAFT**.

This document is the working SSOT candidate for **security organization** under F1–F5 · F6.1–F6.6.

Stop.

Do **NOT** continue to Sprint F6.8 until F6.7 is explicitly advanced / LOCKED by Engineering Architecture Director.

---

## Related documents

| Doc | Role |
|-----|------|
| [`F6_1_ENGINEERING_ARCHITECTURE.md`](./F6_1_ENGINEERING_ARCHITECTURE.md) | Engineering security principles |
| [`F6_2_FRONTEND_ARCHITECTURE.md`](./F6_2_FRONTEND_ARCHITECTURE.md) | Client reflects · never sole gate |
| [`F6_3_BACKEND_ARCHITECTURE.md`](./F6_3_BACKEND_ARCHITECTURE.md) | Authn/authz boundaries · Trust home |
| [`F6_4_API_ARCHITECTURE.md`](./F6_4_API_ARCHITECTURE.md) | Surface identity classes · rate limiting · access outcomes |
| [`F6_5_DATA_ARCHITECTURE.md`](./F6_5_DATA_ARCHITECTURE.md) | Sensitive data ownership · audit history · external data rule |
| [`F6_6_REALTIME_BACKGROUND_JOBS_ARCHITECTURE.md`](./F6_6_REALTIME_BACKGROUND_JOBS_ARCHITECTURE.md) | Async/realtime Trust · workers not a bypass |
| [`F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) | **LOCKED** ownership · gate/staff isolation |
| [`SPRINT_F2_21_EXTERNAL_INTEGRATIONS_ECOSYSTEM.md`](../02_DESIGN/SPRINT_F2_21_EXTERNAL_INTEGRATIONS_ECOSYSTEM.md) | Guest integrations · consent |
| [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) | Approved auth/security stack references — ADR governance |
| [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) | Supreme product question |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | DRAFT — Security architecture: Trust-first laws · authn/authz/identity/session/permission · privacy · sensitive data · secrets · integration guests · rate limiting · abuse prevention · audit · incidents · dependencies; no JWT/OAuth/crypto/infra/code; gate before F6.8 |
