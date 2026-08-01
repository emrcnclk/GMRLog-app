# Bundle Report — GMRLOG Frontend RC1

**Document:** `docs/06_RELEASE/BUNDLE_REPORT.md`  
**Version:** `1.0.0-rc.1`  
**Date:** 2026-07-28  
**Scope:** Reporting only — no optimization work in D3.17.

---

## Method

- Metro production bundle analyzer was **not** executed in CI for this RC (no `expo export` artifact in verification gate).
- Findings are derived from dependency graph, import counts, and D3.14–D3.16 performance notes.
- Treat sizes below as **qualitative / relative** until an EAS production JS artifact is measured on a release machine.

---

## JS bundle (qualitative)

| Segment | Observation |
| ------- | ----------- |
| Entry | `expo-router/entry` |
| Router | Expo Router file-based routes under `app/` |
| UI kit | `@gmrlog/ui` (tokens + components) |
| Data | `@tanstack/react-query` + persist client + Axios |
| Motion | `react-native-reanimated` + `@gmrlog/ui` motion |
| Icons | `lucide-react-native` (named imports — tree-shake friendly) |

**Action for RC2+:** Run `npx expo export` / EAS build and attach numeric Hermes bytecode / JS size to this report.

---

## Largest screen / feature areas (by surface weight)

| Rank | Area | Why heavy |
| ---- | ---- | --------- |
| 1 | Settings hub | Many nested routes + forms |
| 2 | Communities + composer | Detail, members, uploads |
| 3 | Collections / Tier lists | Builders + composers |
| 4 | Messages | Thread + optimistic composer |
| 5 | Content (posts/reviews) | Dual composers + game hub |
| 6 | Profile + library | Multi-tab shelf |

Route-split candidates (documented since D3.15): `features/settings/**`, `tier-lists/**`, `collections/**`, `messages/**`, `communities/**`.

---

## Largest dependencies (runtime)

| Package | Role | Note |
| ------- | ---- | ---- |
| `expo` + RN `0.76.9` | Platform | Dominant native/JS weight |
| `react-native-reanimated` | Motion | Required for D3.14 motion |
| `@tanstack/react-query` (+ persist) | Cache | Persist adds AsyncStorage I/O |
| `lucide-react-native` + `react-native-svg` | Icons | Prefer named icon imports |
| `@gorhom/bottom-sheet` | Sheets | Provider mounted; little sheet UI yet |
| `@shopify/flash-list` | Lists | **Installed but unused** (see Dependency Report) |
| `axios` | HTTP | Thin relative to Expo |

---

## Image cache usage

| Mechanism | Usage |
| --------- | ----- |
| `expo-image` via `CachedImage` | Community card · game card · library section |
| Cache policy | `memory-disk` (D3.14 / memory-policy) |
| Reduce-motion | Crossfade disabled when reduce-motion effective |

---

## FlashList usage

| Metric | Value |
| ------ | ----- |
| Import sites | **0** |
| FlatList remaining | Dominant (events screen uses `LIST_PERF`) |

Deferred migration — not a RC blocker; documented limitation.

---

## Memory observations

| Area | Observation |
| ---- | ----------- |
| Query persistence | Search/health excluded; 7-day max age; corrupt cache discarded |
| Infinite lists | Soft page cap guidance = 3 |
| Lists | `LIST_PERF` / `LIST_PERF_COMPACT` available |
| Navigation | `detachInactiveScreens` guidance documented |
| Providers | Monitoring adapters noop — no SDK memory |

---

## RC declaration

Bundle is **acceptable for Release Candidate** with known follow-ups: measure numeric sizes on EAS, optional FlashList migration, optional route-level code splitting.
