# Production Checklist — GMRLOG Frontend RC1

**Document:** `docs/06_RELEASE/PRODUCTION_CHECKLIST.md`  
**Version:** `1.0.0-rc.1`  
**Date:** 2026-07-28

Use `[x]` when verified.

---

## Expo / app identity

- [x] App name: `GMRLOG`
- [x] Slug: `gmrlog`
- [x] Scheme: `gmrlog`
- [x] Version locked: `1.0.0-rc.1` (`app.config.ts` · `apps/frontend/package.json` · root `package.json`)
- [ ] Build number / Android `versionCode` / iOS `buildNumber` set in EAS remote (appVersionSource: remote)
- [x] Bundle ID / package: `com.gmrlog.app`
- [ ] Final brand **app icon** asset committed
- [ ] Final **adaptive icon** foreground asset committed (background `#09090B` present)
- [ ] Final **splash** image committed (plugin background `#09090B` present)
- [x] Orientation: portrait
- [x] `userInterfaceStyle`: automatic
- [x] New Architecture enabled

---



## EAS

- [x] `eas.json` profiles: development · preview · production
- [x] Production Android: `app-bundle`
- [x] Channels: development / preview / production
- [x] Env maps `APP_ENV` / `EXPO_PUBLIC_APP_ENV`
- [ ] Real `EAS_PROJECT_ID` (placeholder UUID present)
- [ ] Real App Store Connect `ascAppId` (REPLACE placeholder)
- [ ] First `eas build --profile production` green on CI machine

---



## Environment & secrets

- [x] Public env via Zod (`lib/env.ts`) — `APP_ENV`, `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SOCKET_URL`
- [x] `.env.example` documents local + production shapes
- [x] No secrets in repo for API keys (SecureStore for tokens at runtime)
- [x] Production logger silent · monitoring providers disabled
- [x] Release flags in `app.config` extra: persistence on · monitoring off
- [ ] Staging API URL confirmed for preview channel
- [ ] Production API URL confirmed for production channel

---



## Permissions & privacy wording

- [x] iOS photo library usage string
- [x] iOS camera usage string
- [x] Android INTERNET · NETWORK_STATE · READ_MEDIA_IMAGES
- [x] `expo-image-picker` plugin permission copy
- [ ] iOS Privacy Manifest review for store submission (post-RC native audit)
- [ ] Push notification permission wording — **N/A** (no push endpoints invented)
- [ ] Share extension wording — **N/A** (no share extension)

---



## Deep links

- [x] Custom scheme `gmrlog`
- [x] Associated domains `gmrlog.com` / `www.gmrlog.com`
- [x] Android intent filters for https + scheme
- [ ] Universal link domain entitlement verified on Apple/Google consoles

---



## Build toolchain

- [x] Hermes expected via Expo 52 defaults
- [x] Tree shaking: named lucide + package exports
- [x] Minification: EAS/Metro production profile (verify on first store build)
- [x] TypeScript `strict` frontend
- [x] ESLint `max-warnings 0`

---



## Store screenshot checklist (no images generated)

Capture on reference device for Play Store / App Store listing docs:

1. [ ] Authentication (login)
2. [ ] Home (activity feed)
3. [ ] Discover hub
4. [ ] Search
5. [ ] Notifications
6. [ ] Profile (me)
7. [ ] Settings hub
8. [ ] Communities (list or detail)
9. [ ] Collections (list or detail)
10. [ ] Tier Lists (list or builder)
11. [ ] Messaging (inbox or thread)
12. [ ] Events (list or detail)
13. [ ] Review composer
14. [ ] Post composer
15. [ ] Library shelf

---



## Design system freeze

- [x] Feature screens use `@gmrlog/ui` theme tokens (0 hardcoded hex in `features/`)
- [x] RootErrorBoundary Appearance neutrals documented as outside-theme exception
- [x] Spacing · radius · typography · buttons · inputs · ErrorBanner · skeletons · dialogs via DS
- [x] Motion tokens via `@gmrlog/ui` motion (D3.14)

---



## RC gate commands

- [x] `pnpm --filter @gmrlog/frontend build`
- [x] `pnpm --filter @gmrlog/frontend typecheck`
- [x] `pnpm --filter @gmrlog/frontend lint`
- [x] `pnpm --filter @gmrlog/frontend test`
- [ ] Root `pnpm build` (blocked if Prisma engine TLS fails — backend freeze)
- [ ] Store assets + EAS project IDs before GA

---



## Sign-off


| Role            | Result                                       |
| --------------- | -------------------------------------------- |
| Engineering     | [ ] RC ready                                 |
| Design          | [ ] DS freeze accepted (pending final icons) |
| Release captain | [ ] Approve RC1                              |


