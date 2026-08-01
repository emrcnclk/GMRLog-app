# GMRLOG — Sprint F6.9: Infrastructure & DevOps Architecture

**Document:** `docs/06_ENGINEERING/F6_9_INFRASTRUCTURE_DEVOPS_ARCHITECTURE.md`  
**Version:** 1.1  
**Status:** **LOCKED**  
**Sprint:** F6.9 (Infrastructure & DevOps Architecture — organization only)  
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
| 8 | [`F6_1_ENGINEERING_ARCHITECTURE.md`](./F6_1_ENGINEERING_ARCHITECTURE.md) — engineering organization · build philosophy |
| 9 | [`F6_2_FRONTEND_ARCHITECTURE.md`](./F6_2_FRONTEND_ARCHITECTURE.md) — client assembly under delivery |
| 10 | [`F6_3_BACKEND_ARCHITECTURE.md`](./F6_3_BACKEND_ARCHITECTURE.md) — platform assembly under delivery |
| 11 | [`F6_4_API_ARCHITECTURE.md`](./F6_4_API_ARCHITECTURE.md) — contract surface — infrastructure must not rewrite |
| 12 | [`F6_5_DATA_ARCHITECTURE.md`](./F6_5_DATA_ARCHITECTURE.md) — durable truth · backup/recovery kinship |
| 13 | [`F6_6_REALTIME_BACKGROUND_JOBS_ARCHITECTURE.md`](./F6_6_REALTIME_BACKGROUND_JOBS_ARCHITECTURE.md) — async runtime under operations |
| 14 | [`F6_7_SECURITY_ARCHITECTURE.md`](./F6_7_SECURITY_ARCHITECTURE.md) — Trust · secrets · operational security |
| 15 | [`F6_8_TESTING_ARCHITECTURE.md`](./F6_8_TESTING_ARCHITECTURE.md) — CI gates · constitutional regressions |
| 16 | [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) · [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) · [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) — subordinate engineering projections |
| 17 | **This document** — Infrastructure & DevOps Architecture Specification (how operations are organized) |

Never contradict previous freezes.

Never redesign the product.

Never redesign UX or UI.

Never change Information Architecture.

Never invent MVP features.

Never redefine ownership — **all ownership comes from F5.1**.

Never redefine APIs — **API dialect comes from F6.4**.

This sprint specifies **HOW infrastructure, deployment, CI/CD, environments, observability, and operations are organized**.

| Layer | Role relative to this document |
|-------|--------------------------------|
| F1–F4 | Constitutional product · UX · UI law |
| F5 | Product truth — **LOCKED** — what may exist |
| F6.1–F6.8 | Engineering truth — how software and verification are organized |
| **F6.9** | How **runtime delivery and operations** are organized under that law |

This sprint answers:

> “How are infrastructure and operations organized?”

rather than:

> “How do we configure Docker/Kubernetes/cloud?” · “What is the GitHub Actions YAML?” · “Which provider wins?”

| Does | Does not |
|------|----------|
| Define infrastructure · environment · deployment · CI · CD · branch · release · artifact · configuration · secrets · ownership · observability · monitoring · logging · alerting · backup · recovery · availability · scalability · disaster recovery · operational security philosophies · dependency rules | Dockerfiles · compose · Terraform · cloud accounts · GitHub Actions YAML · Kubernetes manifests · NGINX · Cloudflare config · CI scripts · monitoring dashboards as config · secrets · credentials · env values · shell · commands · code · examples |

**Stack note:** `TECH_STACK_DECISIONS.md` and `MONOREPO_STRUCTURE.md` approve Docker · GitHub Actions · Cloudflare kinship · Nginx kinship · Prometheus · Grafana · Loki · containerization philosophy · and related operational tooling. This document assigns **responsibilities**. It does **not** select a cloud vendor as constitutional law, configure those tools, or freeze vendor topology. **Application architecture is cloud-agnostic.** Vendor changes that preserve these responsibilities do not rewrite product law. Stack/tool changes that alter approved engineering choices still require ADR where `TECH_STACK_DECISIONS.md` governs.

**Gate:** Stop after this specification. Do **not** continue to Sprint F6.10 in this deliverable.

---

## Scope

**In scope:** Mission · relationship to prior constitutions · infrastructure philosophy · environment architecture · deployment · CI · CD · release · branch strategy · artifacts · configuration · secrets · infrastructure ownership · observability · monitoring · logging · alerting · backup & recovery · availability & scalability · disaster recovery · operational security · dependency rules.

**Out of scope:**

| Forbidden |
|-----------|
| Dockerfile · docker-compose · Terraform · Kubernetes manifests |
| AWS · Azure · GCP account/setup as constitutional choice |
| GitHub Actions YAML · CI scripts · shell · deployment commands |
| NGINX · Cloudflare · Linux configuration |
| Monitoring tool configuration · alert rule files |
| Secrets · production credentials · environment values |
| Code snippets · examples · implementation tutorials |
| Product · UX · UI · IA · API redesign · new MVP features |

---

## Deliverable map

| Part | §§ | Title |
|------|----|-------|
| A | 1–4 | Mission · Relationship · Infrastructure Philosophy · Environment Architecture |
| B | 5–10 | Deployment · CI · CD · Release · Branch Strategy · Build Artifacts |
| C | 11–13 | Configuration · Secrets · Infrastructure Ownership |
| D | 14–17 | Observability · Monitoring · Logging · Alerting |
| E | 18–21 | Backup & Recovery · Availability & Scalability · Disaster Recovery · Operational Security |
| F | 22–24 | Dependency Rules · Anti-Patterns · Audit Checklist |

---

# PART A — FOUNDATION

---

# 1. Mission

Define the infrastructure and operations organization that every future environment, pipeline, and runtime decision must obey.

Infrastructure exists to **host and deliver** the frozen Product Architecture and the frozen Engineering Architecture. It never becomes a second Source of Truth for product meaning.

| Prefer | Never |
|--------|-------|
| Operational simplicity over cleverness | Clever topology that hides ownership |
| Repeatable deployment | Snowflake servers as lifestyle |
| Environment parity | “Works only in prod” folklore |
| Replaceable infrastructure | Vendor lock that rewrites F5/F6 |
| Graceful degradation | Silent corruption under failure |

---

# 2. Relationship to Previous Constitutions

| Prior law | Infrastructure / DevOps obligation |
|-----------|-------------------------------------|
| F5 (LOCKED) | Infrastructure never invents screens · tabs · ownership · MVP features |
| F5.1 | Runtime topology must not fork Shared Destinations or create a sixth player root |
| F6.1 §21 | Incremental · reproducible builds · CI proves organization health · env config explicit and non-secret in examples |
| F6.2–F6.3 | Apps are assemblies — deploy apps and declared workers, not shadow products |
| F6.4 | Infrastructure never changes APIs — dialect and versioning remain F6.4 |
| F6.5 | Database remains authoritative · backups/recovery protect durable truth · projections rebuildable |
| F6.6 | Queues/workers/realtime are runtime concerns — still not product domains |
| F6.7 | Secrets never leave the backend · operational security protects Trust |
| F6.8 | CI must fail on constitutional regressions — pipelines enforce gates, they do not redefine tests |
| `MONOREPO_STRUCTURE.md` | `infrastructure/` holds runtime & delivery projections — not product meaning |
| `TECH_STACK_DECISIONS.md` | Approved operational tool kinship — organized here, not re-implemented |

On conflict, the higher law wins. Ops convenience never overrides F5 ownership or F6.4 contracts.

---

# 3. Infrastructure Philosophy

## 3.1 Immutable infrastructure laws

| Law |
|-----|
| **Infrastructure exists to serve Product Architecture.** |
| **Infrastructure never defines Product.** |
| **Infrastructure never changes UX.** |
| **Infrastructure never changes ownership.** |
| **Infrastructure never changes APIs.** |
| **Infrastructure is replaceable.** |
| **Application architecture is cloud-agnostic.** |
| **Deployment is repeatable.** |
| **Environment parity is preferred.** |
| **Configuration lives outside code.** |
| **Secrets never live in repositories.** |
| **Observability is mandatory.** |
| **Monitoring serves Trust.** |
| **Logging serves diagnosis.** |
| **Alerts serve operators.** |
| **Alerts never become engagement systems.** |
| **Backups are mandatory.** |
| **Recovery must always be possible.** |
| **Infrastructure failures must degrade gracefully.** |
| **Operational simplicity is preferred over cleverness.** |
| **Every environment should behave consistently.** |

## 3.2 What infrastructure is for

| Is | Is not |
|----|--------|
| A replaceable runtime projection of F6 assemblies | A place to invent product rooms |
| Delivery · isolation · scale · observe · recover | A second Design System or API dialect |
| Cloud-agnostic application meaning on replaceable substrate | Constitutional marriage to one vendor’s product IA |

## 3.3 Preference order

1. Constitutional obedience (F1–F5 · F6.1–F6.8)
2. Trust and safe operations (F6.7)
3. Repeatability and parity
4. Observability and recoverability
5. Simplicity
6. Delivery speed

---

# 4. Environment Architecture

| Principle |
|-----------|
| Environments exist to stage the same product meaning safely — not to fork product law per stage |
| **Environment parity is preferred** — differences are deliberate (scale · data sensitivity · external guest sandboxes), never accidental behaviour forks |
| **Every environment should behave consistently** with respect to F5 ownership and F6 contracts |
| Separation of duties: untrusted change cannot silently become production truth without gates (F6.8) |
| Environment names and counts are operational projections — this document does not mandate a vendor’s env catalog |
| Production holds real player Trust — non-production never uses production secrets or real player archives as lifestyle (F6.7 · F6.8 test data kinship) |
| Guest integrations (Steam · Discord) may use sandbox/guest modes in non-production — absence remains normal |

| Environment law |
|-----------------|
| No environment may expose Version 2 surfaces under MVP naming |
| No environment may redefine API dialect |
| Soft-gates and staff isolation remain true in every environment that claims to run GMRLOG |

## 4.1 Preview Environment Philosophy

Preview environments exist only for temporary verification.

They are:

- disposable
- reproducible
- isolated
- never authoritative

Preview environments must never become permanent infrastructure.

Every preview environment must originate from the same deployment pipeline.

---

# PART B — DELIVERY

---

# 5. Deployment Philosophy

| Principle |
|-----------|
| **Deployment is repeatable.** Same inputs → same artifacts → predictable runtime behaviour |
| Deploy **applications and declared workers** from the monorepo graph — packages are not secretly shipped as second products (F6.1 §21) |
| Deployments must not rewrite product ownership, UX, or APIs |
| Mobile delivery (store / OTA kinship per approved Expo stack) remains a client-assembly concern — still bound to F5 screens and F6.2 organization |
| Failures degrade gracefully — partial deploy must not corrupt durable truth (F6.5 · F6.6) |
| Rollback / forward-fix are first-class operational intents — snowflake hotfix theater is debt |

This document does not define deploy commands or orchestrators.

## 5.1 Deployment operational capabilities

Every deployment must be:

- repeatable
- reversible
- observable

Rollback is considered a normal operational capability,
not an emergency workaround.

Infrastructure must always allow returning to the last known healthy release.

---

# 6. Continuous Integration Philosophy

| Principle |
|-----------|
| CI proves organization health before merge (F6.1 §21 · F6.8 §17) |
| **CI must fail on constitutional regressions** — lint · type · unit · integration · contract · required a11y/security subsets · declared critical journeys |
| CI runs through the monorepo graph — not undocumented side channels |
| Parallelism and caching accelerate CI — they must not introduce hidden shared state across tests (F6.8) |
| CI never “validates into existence” Version 2 product meaning under MVP |
| Pipeline YAML and scripts are out of scope — philosophy binds later subordinate CI docs |

Approved tool kinship includes GitHub Actions per `TECH_STACK_DECISIONS.md`.

---

# 7. Continuous Delivery Philosophy

| Principle |
|-----------|
| CD promotes verified artifacts through environments with explicit gates — not hope-based copy |
| Promotion preserves artifact identity — rebuild-from-different-inputs mid-promotion is a defect unless deliberately versioned |
| Production delivery requires Trust-sensitive review where policy demands — convenience never skips F6.7 |
| Delivery automation serves calm release — never engagement urgency |
| Preview / ephemeral surfaces (if used) must not become undocumented product destinations |

---

# 8. Release Management Philosophy

| Principle |
|-----------|
| Releases map to shippable apps and platform assemblies — changelog honesty over marketing theater |
| Semantic versioning kinship for packages/apps where independent release is required (`MONOREPO_STRUCTURE.md`) |
| Feature flags (if used) never invent undocumented product destinations (F6.1 §21) |
| Mobile store release and backend release may desynchronize in time — contracts must remain compatible (F6.4 additive evolution) |
| Release notes do not rewrite F5 law — they describe what already amended law allows |
| Hotfixes follow the same ownership and gate philosophy — smaller, not lawless |

## 8.1 Release Candidate progression

Release progression:

Development

↓

Release Candidate

↓

Production

Every production release must originate from a verified Release Candidate.

Production must never receive direct experimental deployments.

---

# 9. Branch Strategy Philosophy

| Principle |
|-----------|
| Branching supports reviewable change under constitutional gates — not parallel product universes |
| `MONOREPO_STRUCTURE.md` branch kinship (`main` · `develop` · `feature/*` · `release/*` · `hotfix/*`) is the subordinate projection — this document does not invent a competing strategy |
| Long-lived forks that silently diverge architecture are banned |
| Branch protection exists to enforce F6.8 gates and human review — not bureaucracy theater |
| Environment deployment targets bind to release discipline — not to arbitrary branch folklore |

---

# 10. Build Artifact Philosophy

| Principle |
|-----------|
| Artifacts are the immutable outputs of the monorepo build graph for a given commit/input set |
| Apps ship; packages build as dependencies — packages are not shadow products (F6.1) |
| Artifact provenance must be traceable — what commit · what gates passed |
| Design tokens and shared types breaking the build when violated remains law (F6.1 §21) — ops must not “force green” by skipping type/token gates |
| Artifact stores and registries are operational mechanisms — replaceable, not product meaning |
| Corrupted or ungated artifacts must never be promoted |

---

# PART C — CONFIG · SECRETS · OWNERSHIP

---

# 11. Configuration Management Philosophy

| Principle |
|-----------|
| **Configuration lives outside code.** |
| Configuration expresses environment adaptation — not product IA forks |
| Examples in docs/repos are non-secret and illustrative — never real credentials (F6.1 · F6.7) |
| Clients receive only public runtime configuration appropriate to their surface (F6.2 kinship) — never platform secrets |
| Configuration changes that alter Trust posture require the same seriousness as code — silent prod-only toggles that redefine behaviour are defects |
| Feature flags remain subordinate to F5 — flags do not create destinations |

## 11.1 Configuration vs secrets

Configuration is not a secret.

Secrets are not configuration.

Configuration may be versioned.

Secrets must never be versioned.

---

# 12. Secret Management Philosophy

| Principle |
|-----------|
| **Secrets never live in repositories.** |
| **Secrets never leave the backend** as standing client knowledge (F6.7 §12) |
| Injection through sealed operational boundaries — apps consume capabilities |
| Rotation and revocation are expected — architecture and ops must tolerate them |
| CI/CD secrets are operational secrets — least privilege · audited access · never printed into logs as lifestyle |
| Guest provider secrets stay in platform/adapter boundaries |
| Backup of secret material follows sealed operational policy — not plaintext alongside public docs |

---

# 13. Infrastructure Ownership

| Area | Owner kinship |
|------|---------------|
| Application runtime for `apps/backend` · workers | Platform / backend with DevOps partnership |
| Client delivery pipelines (mobile · web) | Frontend with DevOps partnership |
| Shared CI graph · monorepo pipelines | Platform team |
| `infrastructure/` projections | Platform / DevOps — never product meaning owners |
| Observability baselines | Platform / DevOps with domain on-call kinship |
| Data store operations (backup · restore) | Platform — durable truth stewardship (F6.5) |
| Staff runtime isolation | Staff/platform — never mixed casually into player path ops |

| Ownership laws |
|----------------|
| Ops ownership does not transfer F5.1 product ownership |
| No orphan infrastructure without a human owner |
| Vendor accounts are operational assets — not product constitutions |

---

# PART D — OBSERVABILITY

---

# 14. Observability Philosophy

| Principle |
|-----------|
| **Observability is mandatory.** |
| Observability makes Trust-relevant failures visible without becoming surveillance theater (F6.3 §16 · F6.7) |
| Correlate across edge → service → job → datastore with stable request/correlation IDs |
| Observability covers player path and staff path isolation — staff tools must not starve player path budgets by accident (F6.1 §19 kinship) |
| Absence of observability is an architectural defect for production assemblies |
| Approved kinship: metrics · logs · traces (Prometheus · Grafana · Loki and related stack choices) — roles only, no dashboard JSON here |

## 14.1 Observability triad

Observability consists of:

- Logs
- Metrics
- Traces

None replaces another.

All three describe different perspectives of runtime behaviour.

---

# 15. Monitoring Philosophy

| Principle |
|-----------|
| **Monitoring serves Trust.** |
| Monitor health of assemblies · dependencies · queues · datastore · realtime gateways — against product journeys, not vanity |
| Monitor projection lag honesty where eventual consistency is expected (F6.5 · F6.6) — lag ≠ silent data loss |
| Monitoring never redefines SLAs as engagement pressure on players |
| Health checks are operational signals — not product features (F6.3) |

## 15.1 Monitoring vs alerting

Monitoring observes.

Alerting interrupts.

Monitoring should collect continuously.

Alerting should remain intentionally sparse.

Noise is an operational failure.

---

# 16. Logging Philosophy

| Principle |
|-----------|
| **Logging serves diagnosis.** |
| Structured, correlatable, minimized — enough to operate, not everything by default (F6.3 · F6.7) |
| No secrets · no unnecessary PII · no private archive exfiltration without policy |
| Logs are not player-facing product surfaces · not engagement feeds · not audit-product substitutes (F6.7 §16) |
| Retention is policy-bound — not infinite surveillance |

---

# 17. Alerting Philosophy

| Principle |
|-----------|
| **Alerts serve operators.** |
| **Alerts never become engagement systems.** |
| Alert on Trust-relevant failure · availability · error budget breach · backup failure · security-significant anomaly — not on noise |
| Alerts must be actionable — pages without ownership are defects |
| Player push/in-app notifications remain product consequences (F6.6 §10) — operational alerts must not hijack them as FOMO |
| Alert fatigue is an operational defect — tune ownership, do not silence constitutional signals forever |

---

# PART E — CONTINUITY · SCALE · SECURITY

---

# 18. Backup & Recovery Philosophy

| Principle |
|-----------|
| **Backups are mandatory.** |
| **Recovery must always be possible.** |
| Authoritative datastore backups protect durable product meaning (F6.5) — projections (search · cache) are rebuildable and are not a substitute for datastore backup |
| Backup success/failure must be observable and alertable (§15–§17) |
| Restore drills are part of architecture honesty — untested backups are wishful thinking |
| Backups respect privacy and secret sealing — plaintext dumps in public channels banned |
| Recovery targets (philosophy): restore durable truth · re-establish assemblies · rebuild projections — without rewriting F5 |

This document does not define schedules, tools, or vendor backup products.

## 18.1 Backup vs Disaster Recovery

Backups preserve data.

Disaster Recovery restores service.

One does not replace the other.

---

# 19. Availability & Scalability Philosophy

| Principle |
|-----------|
| Scale along ownership and assembly boundaries — not by forking product meaning (F6.1 · F6.5 · F6.6) |
| Prefer horizontal scale of stateless edges/workers; keep authoritative consistency boundaries honest |
| **Infrastructure failures must degrade gracefully** — read-only · cached · optional realtime absent · guest integrations absent are normal degradations when truthful |
| Cache and search outages must not take down authoritative identity/Trust paths |
| Capacity work never licenses dual authoritative stores or API forks |
| Version 2 scale surfaces receive no MVP scaffolding |

## 19.1 Graceful degradation under partial unavailability

When partial infrastructure becomes unavailable:

the application should reduce capability,

not collapse completely.

Unavailable services should fail independently whenever possible.

---

# 20. Disaster Recovery Philosophy

| Principle |
|-----------|
| Disaster recovery is the organized ability to restore Digital Home continuity after major loss — region · datastore · supply-chain · operator error |
| RTO/RPO numeric targets, when set, live in subordinate ops policy — they must not contradict “recovery must always be possible” |
| DR exercises prove restore + projection rebuild + secret rotation kinship — not paperwork alone |
| DR must not invent a parallel production product with different IA “for emergencies” |
| Communication during incidents remains calm and honest (F6.7 §17) |

---

# 21. Operational Security Philosophy

| Principle |
|-----------|
| Operational security extends F6.7 into runtime: least privilege for humans · machines · pipelines |
| Production access is audited · time-bounded where policy requires · never ambient shared root as lifestyle |
| Supply-chain and dependency hygiene remain build/ops concerns (F6.1 · F6.7) |
| Separations: production secrets ≠ non-production · staff runtime ≠ player runtime where isolation matters |
| Security incidents fail safely — revoke · rotate · isolate (F6.7 §17) |
| Ops tooling never becomes a player engagement surface |

---

# PART F — RULES · CLOSE

---

# 22. Dependency Rules

## 22.1 Allowed direction

```
F5 product law + F6 engineering law
  → application assemblies (mobile · web · backend · workers)
    → replaceable infrastructure substrate
      → observability · backup · delivery mechanisms
```

```
CI gates (F6.8)
  → verified artifacts
    → CD promotion across environments
```

## 22.2 Forbidden direction

| Forbidden |
|-----------|
| Infrastructure → defining product · UX · ownership · APIs |
| Vendor topology → rewriting F6 application architecture as constitutional lock-in |
| Secrets → repositories · client bundles · public logs |
| Alerts → player engagement / FOMO systems |
| Skipping CI constitutional gates to “just deploy” |
| Treating projections (search/cache) as sufficient backup of durable truth |
| Ops runbooks that invent Version 2 MVP scaffolding |
| `infrastructure/` folders that silently become a second product constitution |

## 22.3 Package / tree boundaries

| Area | Role |
|------|------|
| `apps/*` | Deployable assemblies |
| `packages/*` | Build inputs — not shadow production apps |
| `infrastructure/` | Runtime & delivery projections — subordinate to this document |
| `docs/` | SSOT — ops must not fork law into wiki-only constitutions |

## 22.4 Infrastructure portability

Infrastructure dependencies must remain replaceable.

Application domains must never depend on a specific cloud vendor.

Infrastructure adapters isolate vendor-specific behaviour.

---

# 23. Anti-Patterns

| Banned |
|--------|
| Docker/K8s/Terraform/Actions/NGINX/Cloudflare/cloud config · secrets · env values · commands · snippets as this constitution |
| Infrastructure defining product · changing UX · ownership · APIs |
| Cloud-specific application architecture presented as irreplaceable law |
| Snowflake production · non-repeatable deploys · “only works here” |
| Secrets in git · config-as-code containing real credentials |
| Alerts as engagement · player FOMO pages from ops tools |
| No backups · untested restores · cache/search treated as system of record backup |
| Skipping F6.8 gates · force-promoting ungated artifacts |
| Clever opaque topology without owners |
| Parallel emergency IA / API dialect |
| Treating F6.9 as authority over F5 or F6.1–F6.8 |

---

# 24. Audit Checklist

- [ ] Defines how infrastructure and DevOps are organized — no Docker/K8s/Terraform/Actions/cloud config · no secrets · no commands · no code  
- [ ] Explicitly states immutable laws (§3.1): serves product · never defines product/UX/ownership/APIs · replaceable · cloud-agnostic apps · repeatable deploy · parity · config outside code · secrets out of repos · observability mandatory · monitoring/logging/alerting roles · backups/recovery · graceful degradation · simplicity · consistent environments  
- [ ] Environments · deployment · CI · CD · release · branch · artifacts philosophies align with F6.1 · F6.8 · monorepo law  
- [ ] Configuration · secrets · ownership explicit and Trust-aligned (F6.7)  
- [ ] Observability · monitoring · logging · alerting explicit — alerts ≠ engagement  
- [ ] Backup · recovery · availability · scalability · DR · operational security explicit — database authoritative  
- [ ] Dependency rules forbid infra rewriting product/API and skipping constitutional gates  
- [ ] Compatible with F1–F5 and F6.1–F6.8 · `TECH_STACK_DECISIONS.md` · `MONOREPO_STRUCTURE.md`  
- [ ] Gate: stop — do not continue to F6.10 in this deliverable  

---

## Final gate

### LOCKED — Infrastructure Architecture frozen

**Sprint F6.9 — Infrastructure & DevOps Architecture** is **LOCKED** at Version 1.1.

Infrastructure Architecture frozen.

Future operational changes must be introduced only through Amendments.

No new constitutional Infrastructure document may be created inside Phase F6.

---

## Related documents

| Doc | Role |
|-----|------|
| [`F6_1_ENGINEERING_ARCHITECTURE.md`](./F6_1_ENGINEERING_ARCHITECTURE.md) | Build philosophy · monorepo delivery |
| [`F6_4_API_ARCHITECTURE.md`](./F6_4_API_ARCHITECTURE.md) | APIs infrastructure must not change |
| [`F6_5_DATA_ARCHITECTURE.md`](./F6_5_DATA_ARCHITECTURE.md) | Authoritative data · backup/recovery kinship |
| [`F6_6_REALTIME_BACKGROUND_JOBS_ARCHITECTURE.md`](./F6_6_REALTIME_BACKGROUND_JOBS_ARCHITECTURE.md) | Workers · queues under operations |
| [`F6_7_SECURITY_ARCHITECTURE.md`](./F6_7_SECURITY_ARCHITECTURE.md) | Secrets · Trust · incident kinship |
| [`F6_8_TESTING_ARCHITECTURE.md`](./F6_8_TESTING_ARCHITECTURE.md) | CI constitutional gates |
| [`F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md`](../05_PRODUCT_ARCHITECTURE/F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md) | **LOCKED** MVP scope boundary |
| [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) | `infrastructure/` · branch · CI kinship |
| [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) | Docker · Actions · observability stack — ADR governance |
| [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) | Subordinate quality discipline |
| [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) | Supreme product question |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | Version 1.0 — Initial specification |
| 1.1 | July 2026 | Version 1.1 — Operational philosophy refinement |
