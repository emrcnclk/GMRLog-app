# D3.10 Completion Report — Notifications Experience Foundation

**Status:** COMPLETE  
**Completed:** 2026-07-27  
**Scope:** Frontend only — notifications list · mark one read · mark all read · object navigation · refresh-only.  
**Backend:** FEATURE FREEZE — not modified.  
**Not invented:** push · websocket · realtime · grouped notifications · notification settings · delete · archive · inbox categories.  
**D3.11 was not started.**

---

## Files created

### Feature (`features/notifications`)

| Path | Role |
| ---- | ---- |
| `hooks/notification-model.ts` | View model · message · time · href · optimistic cache helpers |
| `hooks/use-notifications.ts` | List (cursor) · mark one · mark all |
| `components/notification-card.tsx` | Avatar placeholder · actor · message · time · unread · object icon |
| `components/notification-icon.tsx` | ObjectType → Lucide icon |
| `components/notification-header.tsx` | Title · Mark all read |
| `components/mark-all-read-button.tsx` | Mark-all CTA |
| `components/notification-skeleton.tsx` | List shimmer |
| `components/empty-notifications.tsx` | Calm empty |
| `components/notification-error-state.tsx` | Offline-aware retry |
| `screens/notifications-screen.tsx` | Tab screen |
| `index.ts` | Barrel |

### Routes

| Path | Role |
| ---- | ---- |
| `app/(app)/(tabs)/notifications/index.tsx` | Notifications tab → `NotificationsScreen` |

### Tests

| Path | Coverage |
| ---- | -------- |
| `hooks/notification-model.spec.ts` | List states · message · href · optimistic · validators · order |
| `hooks/notification-query.spec.ts` | Keys · pages · mark one/all rollback · invalidate |
| `notification-screen.spec.ts` | Loading · empty · ready |
| `notification-navigation.spec.ts` | Tab · object placeholders |

### Docs

| Path | Role |
| ---- | ---- |
| `docs/05_FRONTEND/D3_10_COMPLETION_REPORT.md` | This report |

## Files updated

| Path | Change |
| ---- | ------ |
| `src/api/axios-client.ts` | `listNotifications` · `markNotificationsRead` |
| `src/query/query-client.ts` | `queryKeys.notifications.*` |

---

## Reusable components

| Component | Responsibility |
| --------- | -------------- |
| `NotificationCard` | Memoized row · unread chrome · a11y label |
| `NotificationIcon` | Object type icon chip |
| `NotificationHeader` | Title · conditional Mark all |
| `MarkAllReadButton` | `POST /notifications/read` `{ all: true }` |
| `NotificationSkeleton` | Loading only (no spinner screens) |
| `EmptyNotifications` | Friendly empty copy |
| `NotificationErrorState` | Offline · retry · permission via `mapAuthError` |

---

## Notification architecture

- **List:** `GET /notifications` — cursor pagination (`NOTIFICATION_LIST_DEFAULT_LIMIT`) · FlatList · pull-to-refresh · load more.
- **Order:** Backend newest-first preserved (no client re-sort / grouping).
- **Actor honesty:** S2 has no `actorId` — `actor` is `null`; UI shows avatar **placeholder** + “Someone”.
- **Message honesty:** `kind` / `messageKey` remain opaque strings — humanized (`_`` → space), no invented NotificationKind enum.
- **Read:** `POST /notifications/read` with `{ ids: [id] }` or `{ all: true }` via `notificationsReadSchema`. No delete.
- **No realtime / polling** — refresh only (pull · tab revisit · invalidate after mutation).

### Endpoints used (only)

| Method | Path |
| ------ | ---- |
| GET | `/notifications` |
| POST | `/notifications/read` |

### Query keys

| Hook | Key |
| ---- | --- |
| `useNotifications` | `notifications.list` |
| `useMarkNotificationRead` | optimistic list · invalidate `notifications.list` |
| `useMarkAllNotificationsRead` | optimistic list · invalidate `notifications.list` |

### Navigation (press row)

| ObjectType | Route |
| ---------- | ----- |
| `game` | `/(app)/game/{id}` |
| `review` | `/(app)/review/{id}` |
| `post` | `/(app)/post/{id}` |
| `collection` | `/(app)/collection/{id}` |
| `tier_list` | `/(app)/tier-list/{id}` |
| `community` | `/(app)/community/{id}` |
| `event` | `/(app)/event/{id}` |
| `user` (Profile) | `/(app)/user/{id}` |
| `comment` / `achievement` | no route invented — mark-read only |

Unread press also marks read before navigate when a href exists.

---

## Optimistic updates

1. **Mark one:** cancel list · snapshot infinite pages · set `readAt` on matching id · rollback on error · invalidate list on success.
2. **Mark all:** snapshot · set `readAt` on all unread · rollback on error · invalidate list on success.

---

## Loading states

- Skeleton rows while first page loads.
- Pull-to-refresh on empty and ready.
- Footer skeleton while fetching next page.
- Empty: friendly attention-desk copy.
- Error: offline · retry · permission (`mapAuthError`).

---

## Verification

| Check | Result |
| ----- | ------ |
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS (frontend **186** tests) |
| `pnpm format:check` | PASS |

---

D3.10 Notifications Experience Foundation is COMPLETE.

D3.11 was not started.
