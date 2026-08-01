# Dependency Report — GMRLOG Frontend RC1

**Document:** `docs/06_RELEASE/DEPENDENCY_REPORT.md`  
**Version:** `1.0.0-rc.1`  
**Date:** 2026-07-28  
**App:** `apps/frontend`

---

## Summary

| Check | Result |
| ----- | ------ |
| Duplicate package names in `package.json` | None |
| Unused runtime dependency | `@shopify/flash-list` (0 imports) |
| Under-used | `@gorhom/bottom-sheet` (provider only) |
| Dead feature folders | `features/onboarding/` · `features/tasks/` (empty shells) |
| Unused brand assets | Icon/splash PNGs missing under `assets/` |
| Deprecated Expo packages | None flagged for SDK 52 pin set |

---

## Runtime dependencies

| Package | Used? | Evidence |
| ------- | ----- | -------- |
| `@gmrlog/*` workspace | Yes | Types · UI · validators · api-sdk · config |
| `@tanstack/react-query` (+ persist + async persister) | Yes | Query + offline |
| `@react-native-async-storage/async-storage` | Yes | Persist + mutation queue |
| `@react-native-community/netinfo` | Yes | Connectivity |
| `axios` | Yes | API client |
| `expo-*` suite | Yes | Router · image · picker · secure-store · splash · fonts · linking |
| `lucide-react-native` | Yes | ~21 import sites |
| `react-hook-form` + `@hookform/resolvers` | Yes | Auth/settings/composers |
| `zod` / `zustand` | Yes | Env + stores |
| `react-native-reanimated` / gesture-handler / screens / safe-area / svg / web | Yes | Shell |
| `@gorhom/bottom-sheet` | Partial | `BottomSheetModalProvider` only |
| `@shopify/flash-list` | **No** | Zero `FlashList` imports |

**RC policy:** Do **not** remove FlashList in D3.17 (no behavior change sprint). Track removal or migration for post-RC.

---

## Duplicate exports / components

| Area | Finding |
| ---- | ------- |
| `lib/` vs `src/` shims | Cleaned in D3.16 (dead re-exports removed) |
| Board helpers | Shared under `features/boards/` — intentional reuse |
| Duplicate SessionManager specs | Removed with dead `lib/session` |

---

## Dead / empty folders

| Path | Status |
| ---- | ------ |
| `features/onboarding/` | Empty shell (`export {}`) — keep for future roadmap |
| `features/tasks/` | Empty shell — keep for future roadmap |
| `features/library/` | Thin re-export to profile library — intentional |
| `assets/images` · `assets/fonts` | README placeholders only — **no store icons/splash** |

---

## Unused icons / assets

- No committed adaptive icon / splash artwork.
- Lucide icons imported by name (no full-library dump observed).

---

## Recommendations (post-RC, not D3.17)

1. Migrate heavy FlatLists → FlashList **or** remove unused dependency.
2. Commit brand `icon` / `adaptiveIcon` / `splash` assets and wire `app.config.ts`.
3. Replace EAS placeholder `projectId` / `ascAppId` before store submit.
4. Implement or delete empty `onboarding` / `tasks` shells in a future sprint.
