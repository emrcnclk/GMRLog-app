# D3.8 Completion Report — Messaging Experience Foundation

**Status:** COMPLETE  
**Completed:** 2026-07-27  
**Scope:** Frontend only — inbox · conversation thread · new conversation · optimistic send.  
**Backend:** FEATURE FREEZE — not modified.  
**Realtime / typing / receipts / online / edit-delete / reactions:** not invented.  
**D3.9 was not started.**

---

## Files created

### Feature (`features/messages`)

| Path | Role |
| ---- | ---- |
| `hooks/messaging-model.ts` | Titles · grouping · inverted list · optimistic helpers |
| `hooks/use-messaging.ts` | Conversations · conversation · messages · create · send |
| `components/conversation-card.tsx` | Inbox row |
| `components/message-bubble.tsx` | Mine / theirs · grouped |
| `components/message-composer.tsx` | Body · counter · Send |
| `components/conversation-header.tsx` | Back · title |
| `components/conversation-skeleton.tsx` | Inbox + thread skeletons |
| `components/empty-inbox.tsx` | Empty inbox + CTA |
| `components/empty-conversation.tsx` | Empty thread |
| `components/messaging-error-state.tsx` | Offline-aware retry |
| `screens/conversations-screen.tsx` | Inbox |
| `screens/conversation-screen.tsx` | Thread + composer |
| `screens/new-conversation-screen.tsx` | Create + user picker placeholder |
| `index.ts` | Barrel |

### Routes

| Path | Role |
| ---- | ---- |
| `app/(app)/messages/index.tsx` | Inbox |
| `app/(app)/messages/[id].tsx` | Conversation |
| `app/(app)/messages/new.tsx` | New conversation **modal** |

### Tests

| Path | Coverage |
| ---- | -------- |
| `hooks/messaging-model.spec.ts` | Title · grouping · inverted · optimistic |
| `hooks/messaging-query.spec.ts` | Keys · optimistic rollback · validators |
| `messaging-screen.spec.ts` | Loading · empty · ready |
| `messaging-navigation.spec.ts` | Inbox ↔ conversation · new |

### Docs

| Path | Role |
| ---- | ---- |
| `docs/05_FRONTEND/D3_8_COMPLETION_REPORT.md` | This report |

## Files updated

| Path | Change |
| ---- | ------ |
| `src/api/axios-client.ts` | 5 messaging helpers (list/create/get/messages/send) |
| `src/query/query-client.ts` | `queryKeys.messages.*` |
| `app/(app)/_layout.tsx` | Modal for `messages/new` |
| `features/profile/components/profile-header.tsx` | Messages shortcut (F2.1 overflow) |
| `features/profile/profile-screen.tsx` | Navigate to `/(app)/messages` |

---

## Reusable components

| Component | Responsibility |
| --------- | -------------- |
| `ConversationCard` | Avatar · name · last message · activity · unread (>0 only; backend projects 0) |
| `MessageBubble` | Mine / theirs styles · timestamp · group chrome · optimistic opacity |
| `MessageComposer` | Shared `messageCreateSchema` · counter · disabled while sending |
| `ConversationHeader` | Back · peer/group title |
| `ConversationSkeleton` / `MessageThreadSkeleton` | Shimmer loading |
| `EmptyInbox` / `EmptyConversation` | Calm empty states |
| `MessagingErrorState` | Inline retry · offline copy |

---

## Messaging architecture

- **No bottom tab** — Profile overflow shortcut (F2.1).
- **No realtime / polling** — updates only via pull-to-refresh or successful mutation.
- Endpoints only:
  - `GET /conversations`
  - `POST /conversations`
  - `GET /conversations/{id}`
  - `GET /conversations/{id}/messages`
  - `POST /conversations/{id}/messages` (Idempotency-Key · returns `ConversationResponse`)
- Lists are **arrays** (no cursor) — FlatList + refresh.
- Thread uses **inverted** FlatList; bubbles grouped by consecutive sender.
- New conversation: user-id picker **placeholder** + selected chips → create → navigate to thread.

### Query keys

| Hook | Key |
| ---- | --- |
| `useConversations` | `messages.conversations` |
| `useConversation` | `messages.conversation(id)` |
| `useMessages` | `messages.thread(id)` |
| `useCreateConversation` | invalidate inbox · set detail |
| `useSendMessage` | optimistic thread · invalidate thread + inbox |

---

## Optimistic update flow

1. `onMutate`: cancel thread query · snapshot · append local `optimistic_*` message.
2. UI shows bubble at reduced opacity (“Sending”).
3. `onError`: restore previous thread snapshot.
4. `onSuccess`: set conversation cache · invalidate thread + inbox (server truth via `GET .../messages`).

---

## Loading states

- Skeletons for inbox and thread (no spinner-only screens).
- Composer Send button `loading` while mutation pending.
- Empty states with helpful CTA.
- Error banners + Retry · offline-aware.

---

## Verification

| Check | Result |
| ----- | ------ |
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS (frontend **146** tests) |
| `pnpm format:check` | PASS |

---

D3.8 Messaging Experience Foundation is COMPLETE.

D3.9 was not started.
