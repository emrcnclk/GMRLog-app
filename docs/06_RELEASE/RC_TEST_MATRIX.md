# GMRLOG RC Test Matrix — v1.0.0-rc.1

**Document:** `docs/06_RELEASE/RC_TEST_MATRIX.md`  
**Status:** Release Candidate  
**Scope:** Frontend manual / QA flows (D3.1–D3.16)  
**Backend:** FEATURE FREEZE — exercise only existing S1 contracts  
**How to use:** Mark each row `[ ]` → `[x]` during RC sign-off.

---

## Legend

| Field | Meaning |
| ----- | ------- |
| Preconditions | Auth state · network · seed data |
| Expected | Observable UI / navigation / cache outcome |
| Pass/Fail | Human QA checkbox |

---

## Authentication

### Login — happy path

- **Preconditions:** Guest · online · valid credentials against frozen backend
- **Expected:** AuthGate redirects to `/(app)/(tabs)/home` · session in SecureStore · no Alert
- **Pass/Fail:** [ ]

### Login — invalid credentials

- **Preconditions:** Guest · online · wrong password
- **Expected:** `ErrorBanner` with sign-in failure copy · stays on login
- **Pass/Fail:** [ ]

### Login — offline

- **Preconditions:** Guest · offline
- **Expected:** Offline-aware auth error · no blank screen
- **Pass/Fail:** [ ]

### Logout

- **Preconditions:** Authenticated · Settings → Account
- **Expected:** Confirm dialog · session cleared · redirect `/(auth)` · query cache cleared
- **Pass/Fail:** [ ]

### Expired access token + valid refresh

- **Preconditions:** Authenticated · access JWT expired · refresh valid
- **Expected:** Silent refresh on next API call · request retries · user stays signed in
- **Pass/Fail:** [ ]

### Expired access + failed refresh

- **Preconditions:** Authenticated · refresh invalid/missing
- **Expected:** Session cleared · guest redirected to auth
- **Pass/Fail:** [ ]

### Cold start with persisted session

- **Preconditions:** Prior login · kill app · relaunch
- **Expected:** Bootstrap restores SecureStore session · lands in app (or refresh/clear path)
- **Pass/Fail:** [ ]

---

## Home

### Feed — ready

- **Preconditions:** Authenticated · online · activity available
- **Expected:** Loading → Ready · activity cards · pull-to-refresh works
- **Pass/Fail:** [ ]

### Feed — empty

- **Preconditions:** Authenticated · empty activity
- **Expected:** Empty state · no crash
- **Pass/Fail:** [ ]

### Feed — error / offline

- **Preconditions:** API fail or offline with/without cache
- **Expected:** Error/offline state · ErrorBanner or offline-aware empty · OfflineBanner if offline · retry
- **Pass/Fail:** [ ]

---

## Discover

### Hub modules

- **Preconditions:** Authenticated · online
- **Expected:** Hub loads · navigate to games / communities / events lists
- **Pass/Fail:** [ ]

### Games / Communities / Events lists

- **Preconditions:** Authenticated
- **Expected:** Loading · Empty · Error · Ready · offline-aware · pull-to-refresh where wired
- **Pass/Fail:** [ ]

---

## Search

### Query results

- **Preconditions:** Authenticated · type query
- **Expected:** Debounced search · results · empty for no hits · ErrorBanner on fail
- **Pass/Fail:** [ ]

### Recent searches

- **Preconditions:** Prior searches stored
- **Expected:** Chips restore · clear works · no invented endpoints
- **Pass/Fail:** [ ]

### Open hit → stub profile/detail

- **Preconditions:** Result navigates to `user/[id]` or placeholder detail
- **Expected:** Placeholder screen · no crash · back works
- **Pass/Fail:** [ ]

---

## Notifications

### Inbox list

- **Preconditions:** Authenticated
- **Expected:** Loading/Empty/Error/Ready · OfflineBanner when offline
- **Pass/Fail:** [ ]

### Mark one read

- **Preconditions:** Unread notification · online
- **Expected:** Optimistic read · rollback on fail · invalidate on success
- **Pass/Fail:** [ ]

### Mark all read

- **Preconditions:** Multiple unread · online
- **Expected:** Optimistic all-read · rollback on fail
- **Pass/Fail:** [ ]

### Mark read offline (queued)

- **Preconditions:** Offline · allowlisted mutation
- **Expected:** Optimistic UI · queue pending · sync on reconnect
- **Pass/Fail:** [ ]

### Open notification target

- **Preconditions:** Notification with deep target
- **Expected:** Navigates to documented route or placeholder · no invented API
- **Pass/Fail:** [ ]

---

## Profile

### Me profile tabs

- **Preconditions:** Authenticated
- **Expected:** Overview / library / reviews / collections / tiers tabs · pull-to-refresh
- **Pass/Fail:** [ ]

### Edit profile

- **Preconditions:** Authenticated · online
- **Expected:** Modal · ErrorBanner on fail · updates `me` cache
- **Pass/Fail:** [ ]

### Avatar upload

- **Preconditions:** Photo permission · online
- **Expected:** Grant → PUT → confirm flow · progress overlay · honest error if backend rejects avatar id on PATCH
- **Pass/Fail:** [ ]

### Banner upload

- **Preconditions:** Same as avatar
- **Expected:** Same upload pipeline · honest failure if backend freeze rejects
- **Pass/Fail:** [ ]

---

## Library

### Shelf rendering

- **Preconditions:** Authenticated · library entries exist or empty
- **Expected:** Hub counts / entries · Loading/Empty/Error/Ready
- **Pass/Fail:** [ ]

### Add / update / delete entry

- **Preconditions:** Authenticated · online · game available
- **Expected:** Mutations succeed against S1 · optimistic/rollback where implemented · list refresh
- **Pass/Fail:** [ ]

---

## Reviews

### Create / edit / delete

- **Preconditions:** Authenticated · game context
- **Expected:** Composer · ErrorBanner · optimistic update/delete with detail restore on delete fail
- **Pass/Fail:** [ ]

### Game reviews list

- **Preconditions:** Game with reviews
- **Expected:** List states · navigation to composer/detail placeholder
- **Pass/Fail:** [ ]

---

## Posts

### Create / edit / delete

- **Preconditions:** Authenticated · game context
- **Expected:** Composer · ErrorBanner · delete restores detail on failure
- **Pass/Fail:** [ ]

---

## Communities

### Create / edit / delete

- **Preconditions:** Authenticated · online
- **Expected:** Composer flows · delete restores detail on fail · list/discover invalidate
- **Pass/Fail:** [ ]

### Join / Leave

- **Preconditions:** Community detail
- **Expected:** Optimistic membership · offline queue when offline · reconnect flush
- **Pass/Fail:** [ ]

### Members list

- **Preconditions:** Joined community
- **Expected:** Members load · Loading/Empty/Error/Ready
- **Pass/Fail:** [ ]

### Community banner upload

- **Preconditions:** Owner · image picker
- **Expected:** Upload manager runs · honest if community lacks `bannerUploadId` on API
- **Pass/Fail:** [ ]

---

## Collections

### Create / edit / entries / delete

- **Preconditions:** Authenticated
- **Expected:** CRUD + entries replace · delete detail rollback on fail · board helpers reused
- **Pass/Fail:** [ ]

---

## Tier Lists

### Create / builder / edit / delete

- **Preconditions:** Authenticated
- **Expected:** Builder slots · composer · delete detail rollback on fail
- **Pass/Fail:** [ ]

---

## Messaging

### Inbox / conversation / send

- **Preconditions:** Authenticated · online
- **Expected:** Conversations list · thread · optimistic send with rollback · ErrorBanner · no invented websocket
- **Pass/Fail:** [ ]

### Send offline

- **Preconditions:** Offline in thread
- **Expected:** Honest failure or non-queued behavior (messages **not** in offline allowlist) · no fake delivery
- **Pass/Fail:** [ ]

### New conversation

- **Preconditions:** Authenticated
- **Expected:** Compose against existing API · ErrorBanner on fail
- **Pass/Fail:** [ ]

---

## Events

### List / detail

- **Preconditions:** Authenticated
- **Expected:** Discover events + detail · Loading/Empty/Error/Ready/Offline
- **Pass/Fail:** [ ]

### Going / Leave

- **Preconditions:** Event detail
- **Expected:** Optimistic participation · offline queue · reconnect sync
- **Pass/Fail:** [ ]

---

## Uploads

### Grant → PUT → confirm

- **Preconditions:** Online · picker selected image within limits
- **Expected:** Progress states · ErrorBanner on fail · no invented endpoints
- **Pass/Fail:** [ ]

### Backend reject of upload id on profile patch

- **Preconditions:** Confirmed upload · PATCH /me with upload id on frozen stub
- **Expected:** Honest ErrorBanner · no silent fake success
- **Pass/Fail:** [ ]

---

## Settings

### Theme

- **Preconditions:** Authenticated
- **Expected:** Appearance patch optimistic · persists · theme applies
- **Pass/Fail:** [ ]

### Reduce motion

- **Preconditions:** Authenticated
- **Expected:** Accessibility patch · motion falls back · OfflineBanner unaffected
- **Pass/Fail:** [ ]

### Notification prefs / privacy / delete account

- **Preconditions:** Settings hub
- **Expected:** Honest placeholders · no invented PATCH · no Alert
- **Pass/Fail:** [ ]

### Storage clear / Diagnostics / About

- **Preconditions:** Settings
- **Expected:** Local clear where documented · diagnostics read-only · about/licenses placeholder
- **Pass/Fail:** [ ]

### Logout from settings

- **Preconditions:** Authenticated
- **Expected:** Same as Authentication → Logout
- **Pass/Fail:** [ ]

---

## Cross-cutting

### OfflineBanner

- **Preconditions:** Toggle airplane mode in-app
- **Expected:** Banner appears · tree not blanked · cached reads may show
- **Pass/Fail:** [ ]

### RootErrorBoundary

- **Preconditions:** Dev-only forced throw (if available) or code review
- **Expected:** Retry/Reload · no white screen · diagnostics only in development
- **Pass/Fail:** [ ]

### Deep link scheme

- **Preconditions:** `gmrlog://` or `https://gmrlog.com/...` cold open
- **Expected:** Expo Router resolves · AuthGate still applies
- **Pass/Fail:** [ ]

### Accessibility smoke

- **Preconditions:** TalkBack / VoiceOver on primary flows
- **Expected:** Labels on primary actions · min touch · reduce motion respected
- **Pass/Fail:** [ ]

---

## RC sign-off

| Role | Name | Date | Result |
| ---- | ---- | ---- | ------ |
| QA | | | [ ] Pass / [ ] Fail |
| Engineering | | | [ ] Pass / [ ] Fail |
| Release captain | | | [ ] Pass / [ ] Fail |

**Known stubs (not failures):** `/(modals)` shell · `user/[id]` placeholder · post/review detail placeholders · empty `onboarding/` · `tasks/` shells.
