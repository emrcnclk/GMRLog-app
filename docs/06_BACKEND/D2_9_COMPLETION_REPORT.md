# D2.9 Completion Report — Tier List Domain Foundation

**Status:** LOCKED  
**Completed:** 2026-07-26  
**Scope:** Tier list domain only — D2.10 was not started.

---

## Dialect note

S1 §13.8 defines:

- `GET /tier-lists` (P — own index)
- `POST /tier-lists`
- `GET /tier-lists/{id}` (P\|G)
- `PATCH /tier-lists/{id}`
- `DELETE /tier-lists/{id}`
- `PUT /tier-lists/{id}/slots` — whole-board replace

No incremental slot POST/PATCH/DELETE routes were added.  
`GET /tier-lists` has no `ownerId` query in S1 (unlike collections).

---

## 1. Files created

### Backend — `apps/backend/src/tierlists/`

| File | Role |
| --- | --- |
| `tierlists.module.ts` | Domain module |
| `tierlists.tokens.ts` | DI tokens |
| `tierlists.service.ts` | CRUD · soft-delete · visibility · ownership |
| `tier-slot.service.ts` | PUT board replace · duplicate/game checks |
| `tierlists.controller.ts` | Tier list resource |
| `tier-slots.controller.ts` | `PUT /tier-lists/{id}/slots` |
| `dto/tierlist.dto.ts` | Zod DTOs |
| `mappers/tierlist.mapper.ts` | → `TierListResponse` · visibility gate |
| `testing/fake-repositories.ts` | Test fakes |
| `tierlists.service.spec.ts` · `tierlists.controller.spec.ts` | Tests |

### Packages

| File | Change |
| --- | --- |
| `packages/database/.../tier-list.repository.ts` | New |
| `packages/database/.../tier-slot.repository.ts` | New (`replaceSlots` transaction) |
| `packages/database/.../repositories.spec.ts` | Soft-delete · public list · board replace |
| `packages/types/src/index.ts` | `TierListResponse` · `TierSlotResponse` · `TierSlotGameResponse` |
| `packages/validators/src/index.ts` | create/patch/slots-put schemas |

`app.module.ts` mounts `TierListsModule`.

---

## 2. Endpoint summary

| Method | Path | Auth | Behavior |
| --- | --- | --- | --- |
| GET | `/tier-lists` | P | Own index |
| POST | `/tier-lists` | P | Create · default `visibility=public` |
| GET | `/tier-lists/{id}` | P\|G | Soft-gate · visibility filtered |
| PATCH | `/tier-lists/{id}` | P | Owner only · version++ |
| DELETE | `/tier-lists/{id}` | P | Soft-delete · 204 |
| PUT | `/tier-lists/{id}/slots` | P | Whole-board replace · owner only |

---

## 3. Repository summary

**TierListRepository:** `create` · `findById` · `findActiveById` · `listByOwner` · `listPublicByOwner` · `update` · `softDelete` · `delete`

**TierSlotRepository:** `listSlots` · `replaceSlots` (transactional delete slots + cascade games, then insert)

Persistence only. Soft-deleted tier lists excluded from active lookups/lists.

---

## 4. Service summary

**TierListsService:** create/update/soft-delete · own list · ownership · visibility (`followers` fail-closed)

**TierSlotService:** full board replace · board-wide unique `gameId` → 409 · missing game → 404 · empty tiers allowed · array order = positions

No voting · templates · collaboration · feed · notifications · websocket · recommendations.

---

## 5. Validation summary

`@gmrlog/validators`:

- `title`: trimmed · non-empty · max 100
- `visibility`: `public` \| `followers` \| `private`
- `slots[]`: `{ label, gameIds[] }` — label trimmed · non-empty · max 40
- `.strict()` — unknown fields rejected

---

## 6. Test summary

- Repository: soft-delete · listPublicByOwner · transactional replace · empty tier
- Service: create · visibility · ownership · duplicate/missing game · order preserve
- Controller: guest 401 · envelope/`requestId` · validation · 403 · 204 · PUT 409/404
- Backend coverage increased — **139/139** tests

---

## 7. Verification

`pnpm build` ✅ · `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ · `pnpm format:check` ✅

---

## 8. Deferred (D2.10+)

- Incremental slot POST/PATCH/DELETE (not in S1)
- Follow-aware `followers` visibility
- Voting · templates · collaborative editing
- Comments · reactions on tier lists
- Recommendations · analytics · feed · notifications · websocket
- Drag-drop UI · ranking algorithms

---

## Lock statement

**D2.9 is LOCKED.**  
**D2.10 was not started.**
