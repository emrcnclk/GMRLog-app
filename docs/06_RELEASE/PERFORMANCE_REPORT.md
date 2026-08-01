# Performance Report — GMRLOG Frontend RC1

**Document:** `docs/06_RELEASE/PERFORMANCE_REPORT.md`  
**Version:** `1.0.0-rc.1`  
**Date:** 2026-07-28  
**Method:** Architectural measurement notes + D3.14–D3.16 audits. Numeric device profiling deferred to EAS RC device lab.

---

## Targets (qualitative)

| Path | Expectation | Current levers |
| ---- | ----------- | -------------- |
| Cold start | Splash held until fonts + crash recovery (parallel) | `runParallelBootstrap` · PersistQueryClient hydrate |
| Navigation latency | Stack/modal motion from DS; interruptible | Reanimated · reduce-motion fallback |
| Tab switch | No extra product work beyond reconnect hooks | AuthGate idle · RQ onlineManager |
| List rendering | Windowing defaults | `LIST_PERF` (events) · FlatList elsewhere |
| Large lists | Soft infinite page guidance | Cap = 3 pages (policy) |
| Cached images | Disk+memory | `CachedImage` / expo-image |
| Memory | Bounded query persist · ephemeral search | Cache buster · corrupt discard |

---

## Cold start

1. Hold splash  
2. Parallel: load fonts + crash-recovery cache probe  
3. Mount providers (Error → Theme → Query persist → Auth → Api → Motion → Connectivity)  
4. Auth bootstrap from SecureStore  
5. Release splash  

**Risk:** First hydration of large persisted cache on low-end devices — mitigated by max-age + buster.

---

## Navigation

- Expo Router stacks with D3.14 motion options.
- Auth redirects are pure decision (`resolveAuthGate`) — minimal work.
- Known placeholder routes avoid heavy unknown screens.

---

## Lists & images

| Mechanism | Adoption |
| --------- | -------- |
| FlatList | Primary |
| FlashList | Not adopted (dependency present) |
| LIST_PERF | Events screen |
| expo-image | Avatar/game/community/library surfaces via CachedImage |

---

## Memory

| Source | Control |
| ------ | ------- |
| Query cache | Persist filter excludes search/health |
| Offline queue | Allowlisted mutations only |
| Images | memory-disk · prefer sized sources |
| Monitoring SDKs | Not enabled |

---

## Measured numeric gaps

RC1 does **not** claim millisecond budgets (F4.9 forbids engagement timing theater). Device lab should record:

- [ ] Cold start to interactive (ms) on mid-tier Android  
- [ ] Tab switch p95  
- [ ] Discover list scroll FPS  
- [ ] Peak JS heap after 10 min browse  

---

## Verdict

**Performance architecture is RC-ready.** FlashList migration and numeric lab numbers are post-RC improvements, not code-freeze blockers.
