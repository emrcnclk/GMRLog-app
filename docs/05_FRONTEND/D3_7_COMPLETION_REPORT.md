# D3.7 Completion Report — Reviews & Posts Experience Foundation

**Status:** COMPLETE  
**Completed:** 2026-07-27  
**Scope:** Frontend only — production create/edit/delete for Reviews & Posts · game lists · modal composers.  
**Backend:** FEATURE FREEZE — not modified.  
**D3.8 was not started.**

---

## Files created

### Feature (`features/content`)

| Path | Role |
| ---- | ---- |
| `hooks/content-model.ts` | Form schemas · dirty detect · list view-model |
| `hooks/map-content-error.ts` | Envelope → banner (incl. 409) |
| `hooks/use-reviews.ts` | `useGameReviews` · `useReview` · create/update/delete |
| `hooks/use-posts.ts` | `useGamePosts` · `usePost` · create/update/delete |
| `components/review-composer.tsx` | Create/Edit Review form |
| `components/post-composer.tsx` | Create/Edit Post form |
| `components/rating-selector.tsx` | Rating 1–10 |
| `components/spoiler-badge.tsx` | Spoiler badge / toggle |
| `components/visibility-selector.tsx` | public · followers · private |
| `components/review-card.tsx` | Memoized review row |
| `components/post-card.tsx` | Memoized post row |
| `components/composer-header.tsx` | Modal chrome |
| `components/composer-footer.tsx` | Save · delete · counters |
| `components/composer-skeleton.tsx` | Composer loading |
| `components/confirm-dialog.tsx` | Discard / delete confirm |
| `components/empty-game-reviews.tsx` | Empty reviews + CTA |
| `components/empty-game-posts.tsx` | Empty posts + CTA |
| `components/content-list-skeleton.tsx` | List shimmer |
| `components/content-error-state.tsx` | Error + retry |
| `screens/game-hub-screen.tsx` | Game entry → reviews/posts/create |
| `screens/game-reviews-screen.tsx` | `GET /games/{id}/reviews` |
| `screens/game-posts-screen.tsx` | `GET /games/{id}/posts` |
| `screens/review-composer-screens.tsx` | Create / Edit Review |
| `screens/post-composer-screens.tsx` | Create / Edit Post |
| `index.ts` | Barrel |

### Routes

| Path | Role |
| ---- | ---- |
| `app/(app)/game/[id]/index.tsx` | Game hub |
| `app/(app)/game/[id]/reviews.tsx` | Game reviews |
| `app/(app)/game/[id]/posts.tsx` | Game posts |
| `app/(app)/review/create.tsx` | Create Review **modal** |
| `app/(app)/review/[id]/index.tsx` | Review Details placeholder |
| `app/(app)/review/[id]/edit.tsx` | Edit Review **modal** |
| `app/(app)/post/create.tsx` | Create Post **modal** |
| `app/(app)/post/[id]/index.tsx` | Post Details placeholder |
| `app/(app)/post/[id]/edit.tsx` | Edit Post **modal** |

### Tests

| Path | Coverage |
| ---- | -------- |
| `hooks/content-model.spec.ts` | Forms · validation · dirty · loading |
| `hooks/content-query.spec.ts` | Keys · optimistic delete · invalidate |
| `hooks/map-content-error.spec.ts` | Offline · 409 · validation |
| `components/content-cards.spec.ts` | Card field contracts |
| `content-navigation.spec.ts` | Game → list → create · detail · edit |

### Docs

| Path | Role |
| ---- | ---- |
| `docs/05_FRONTEND/D3_7_COMPLETION_REPORT.md` | This report |

## Files updated

| Path | Change |
| ---- | ------ |
| `src/api/axios-client.ts` | Review/post CRUD + game list helpers |
| `src/query/query-client.ts` | `reviews.detail` · `reviews.byGame` · `posts.*` |
| `app/(app)/_layout.tsx` | Modal presentation for composers |
| `features/profile/components/review-card.tsx` | Re-exports content `ReviewCard` |

---

## Reusable components

| Component | Responsibility |
| --------- | -------------- |
| `ReviewComposer` | Full review form · discard · delete |
| `PostComposer` | Full post form · library game picker · disabled media |
| `RatingSelector` | Integer rating 1–10 |
| `SpoilerBadge` | Display badge or switch |
| `VisibilitySelector` | Closed visibility vocabulary |
| `ReviewCard` / `PostCard` | Memoized FlatList rows |
| `ComposerHeader` / `ComposerFooter` | Modal chrome · counters · mutation buttons |
| `ComposerSkeleton` | Load edit target without spinner screens |

---

## Form architecture

- RHF + `useAppForm` + shared Zod (`reviewCreateSchema` / `reviewPatchSchema` / `postCreateSchema` / `postPatchSchema`).
- Composer forms keep string bodies; empty review body → `null` on submit.
- Character counters: review **10_000** · post **5_000**.
- Save disabled until valid; edit requires dirty values; duplicate submits blocked via mutation `isPending`.
- Unsaved changes → discard confirmation dialog.
- Auto-focus first text field · keyboard avoidance.

---

## Mutation flow

| Hook | API | Side effects |
| ---- | --- | ------------ |
| `useCreateReview` | `POST /reviews` (+ Idempotency-Key) | Set detail · invalidate game reviews · activity |
| `useUpdateReview` | `PATCH /reviews/{id}` | Optimistic detail + list · rollback · invalidate |
| `useDeleteReview` | `DELETE /reviews/{id}` | Optimistic list remove · rollback · invalidate |
| `useCreatePost` | `POST /posts` (+ Idempotency-Key) | Set detail · invalidate game posts · activity |
| `useUpdatePost` | `PATCH /posts/{id}` | Optimistic · rollback · invalidate |
| `useDeletePost` | `DELETE /posts/{id}` | Optimistic · rollback · invalidate |

---

## Optimistic updates

- **Update:** patch cached detail + matching game list row; restore previous on error.
- **Delete:** remove from game list cache immediately; restore previous list on error.
- Confirmation modal before delete.

---

## Loading states

- List / composer **skeletons** (no spinner-only screens).
- Mutation **loading** on Save / Delete buttons.
- Empty states with Write CTA.
- Offline-aware error banners + Retry.

### Pagination note

`GET /games/{id}/reviews` and `GET /games/{id}/posts` return **arrays** (no cursor meta in implementation). Lists use FlatList + pull-to-refresh; cursor infinite query is not invented.

---

## Verification

| Check | Result |
| ----- | ------ |
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS (frontend **129** tests) |
| `pnpm format:check` | PASS |

---

D3.7 Reviews & Posts Experience Foundation is COMPLETE.

D3.8 was not started.
