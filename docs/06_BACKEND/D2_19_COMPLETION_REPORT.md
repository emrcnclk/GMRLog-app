# D2.19 Completion Report — Moderation Domain Foundation

**Status:** LOCKED  
**Completed:** 2026-07-27  
**Scope:** Moderation / Reports MVP — D2.20 was not started.

---

## Dialect note

S2 §10.10–10.11 documents `Report` · `ModerationCase` · `AdminActionRecord`. D2.19 implements the constitutional MVP per sprint authority: **player report create only** — no AI moderation · automatic bans · spam detection · toxicity scoring · websocket · notifications · BullMQ · email · admin dashboard · review queues · ML · staff HTTP queue.

S1 v1.1 §13.13 defines the player report endpoint:

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| POST | `/reports` | P | Create report |

S1 §14.17 `ReportCreateRequest`: `targetType` · `targetId` · `reason` · optional `details`.  
Player-safe `ReportResponse` (no §15.18 staff fields). `ModerationCase` is created automatically for ObjectType-mappable targets.

**Not mounted (staff auth deferred):** `GET /staff/moderation/queue` · `GET/POST /staff/moderation/reports/{id}` · blocks (`POST/DELETE /blocks` — separate S1 resource).

---

## 1. Files created

### Backend — `apps/backend/src/moderation/`

| File | Role |
| ---- | ---- |
| `moderation.module.ts` | Domain module · DI for report/case/target repos |
| `moderation.tokens.ts` | DI tokens |
| `moderation.service.ts` | Create report · duplicate · target · case |
| `moderation.controller.ts` | S1 §13.13 (`@Controller('reports')`) |
| `dto/moderation.dto.ts` | `ReportCreateDto` |
| `mappers/moderation.mapper.ts` | → `ReportResponse` / `ModerationCaseResponse` |
| `testing/fake-repositories.ts` | Test fakes |
| `moderation.service.spec.ts` · `moderation.controller.spec.ts` | Tests |

### Packages

| File | Change |
| ---- | ------ |
| `packages/database/.../report.repository.ts` | create · find · open-duplicate · status |
| `packages/database/.../moderation-case.repository.ts` | create · findByReportId · status |
| `packages/database/.../admin-action.repository.ts` | create · list (staff audit foundation) |
| `packages/database/.../repositories.spec.ts` | Report · ModerationCase · AdminAction tests |
| `packages/types/src/index.ts` | `ReportResponse` · `ModerationCaseResponse` · reason/status types |
| `packages/validators/src/index.ts` | `reportCreateSchema` · soft reason allowlist |

`app.module.ts` mounts `ModerationModule`.

---

## 2. Endpoint summary

| Method | Path | Auth | Behavior |
| ------ | ---- | ---- | -------- |
| POST | `/reports` | P | Creates `open` report · optional ModerationCase · returns player-safe `ReportResponse` |

- Guest → **401**. Self-report → **403**. Duplicate open report → **409**. Missing target → **404**. Invalid reason → **400**.
- Soft reason set: `spam` · `harassment` · `hate_speech` · `misinformation` · `spoiler` · `nsfw` · `copyright` · `other`.
- `details` accepted per S1; **not persisted** (S2 Report has no details column).
- `message` targets: report created; ModerationCase skipped (`message` ∉ ObjectType).

---

## 3. Repository summary

**ReportRepository** — persistence only: create · findById · findOpenByReporterAndTarget · listByReporter · updateStatus.

**ModerationCaseRepository** — persistence only: create · findById · findByReportId · updateStatus.

**AdminActionRepository** — persistence only (staff audit foundation). Not written on player report create.

---

## 4. Service summary

- **createReport** — active reporter · self-report forbid · target existence · open-duplicate guard · persist report · open ModerationCase when target maps to ObjectType.

No AI · auto-ban · staff resolve · notifications.

---

## 5. Validation summary

| Schema | Rules |
| ------ | ----- |
| `reportCreateSchema` | `targetType` closed enum; `targetId` opaque; `reason` soft allowlist; `details` optional trim 1–2000 |

---

## 6. Test summary

- **Repository:** report duplicate lookup · case-by-report · admin-action list
- **Service:** case creation · self-report · duplicate · missing target · details accepted
- **Controller:** guest **401** · envelope · invalid reason **400** · self **403** · duplicate **409** · missing **404**
- Backend coverage — green suite
- Database coverage — green suite

---

## 7. Verification

`pnpm build` ✅ · `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ · `pnpm format:check` ✅

---

## 8. Deferred (D2.20+)

- Staff moderation queue / resolve (S1 §13.16)
- Blocks domain (`POST/DELETE /blocks`)
- Persist `details` (requires S2 amendment)
- ModerationCase for `message` targets (ObjectType gap)
- AdminAction writes on staff resolve
- AI · auto-bans · spam/toxicity ML · websocket · notifications · BullMQ · email

---

## Lock statement

**D2.19 Moderation Domain Foundation is LOCKED.**  
**D2.20 was not started.**
