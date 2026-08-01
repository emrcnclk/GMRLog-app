# GMRLOG Release Notes — v1.0.0-rc.1

**Document:** `docs/06_RELEASE/RELEASE_NOTES_v1.md`  
**Channel:** Release Candidate  
**Frontend:** Expo SDK 52 · React Native 0.76  
**Backend:** FEATURE FREEZE (S1/S2 authoritative)

---

## Features (shipped D3.1–D3.16)

- Authentication (email/password sessions · SecureStore · refresh recovery)
- Home activity feed
- Discover hub (games · communities · events)
- Search with recent history
- Notifications inbox (mark one / mark all)
- Profile (me) with library · reviews · collections · tier tabs
- Library shelf management
- Reviews & posts composers
- Communities (CRUD · join/leave · members)
- Collections & tier lists (including builders)
- Events (Going / Leave)
- Messaging (conversations · send with optimistic UI)
- Uploads foundation (grant → PUT → confirm)
- Settings (appearance · accessibility · account · storage · diagnostics · about)
- Design system motion · offline persistence · production hardening

---

## Architecture

- Monorepo packages: `@gmrlog/ui` · `types` · `validators` · `api-sdk` · `config`
- Expo Router navigation groups: `(auth)` · `(app)` · `(settings)` · `(modals)`
- TanStack Query + AsyncStorage persistence · allowlisted offline mutations
- Axios S1 envelope client · Idempotency-Key · 401 refresh
- Design tokens via `@gmrlog/ui` (semantic color · space · type · motion)
- Logging abstraction · monitoring DI (providers **not** enabled)

---

## Known backend limitations

- Backend remains **FEATURE FREEZE** — no new endpoints or DTO fields in this RC.
- Some profile upload id patches may fail on frozen upload confirmation stubs.
- Community banner may lack a dedicated `bannerUploadId` contract — UI stays honest.
- Notification preference PATCH and account deletion APIs are **not** invented — settings show placeholders.
- Privacy controls are placeholders where S1 lacks writable contracts.
- Realtime websockets / push notifications are **out of scope** for RC1.

---

## Upload limitations

- Pipeline: `POST /uploads/grants` → PUT `uploadUrl` → `POST /uploads/confirmations`.
- Offline upload queue is **not** enabled (not allowlisted).
- PUT host may be environment-specific stub in local/dev.

---

## Notification limitations

- List + mark-read / mark-all-read only.
- No push permission flow · no preference sync endpoint.
- Deep targets may land on placeholder profile/detail routes.

---

## Privacy placeholders

- Settings privacy / delete-account screens explain limitations without fake APIs.
- Tokens live in SecureStore; query cache excludes ephemeral search.

---

## Future roadmap (post-RC — not started here)

- D3.17+ store assets (final icons · splash · Privacy Manifest store packing)
- FlashList migration or dependency removal
- Numeric bundle/perf lab attachment
- Enable monitoring providers behind DI when approved
- Unfreeze backend for upload/profile/privacy gaps
- Fill `onboarding` / `tasks` or remove shells
- Universal link console verification · real EAS project IDs

---

## Upgrade / install notes

1. Set `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_SOCKET_URL` for the target environment.  
2. Set `APP_ENV` / `EXPO_PUBLIC_APP_ENV` to `staging` or `production`.  
3. Configure `EAS_PROJECT_ID` before cloud builds.  
4. Do not commit secrets — use EAS secrets / local untracked `.env`.

---

**RC statement:** Frontend `1.0.0-rc.1` is the Release Candidate code freeze for GMRLOG mobile, pending store assets and EAS identity placeholders.
