# D2.18 Completion Report — Uploads Domain Foundation

**Status:** LOCKED  
**Completed:** 2026-07-27  
**Scope:** Uploads domain MVP — D2.19 was not started.

---

## Dialect note

S2 §10.10 documents `Upload` as an owner-scoped grant/confirm record (`purpose` · `storageKey` · `status`: `granted` \| `uploaded` \| `confirmed` \| `expired`). D2.18 implements the constitutional MVP per sprint authority: **registration + confirmation only** — no S3 · image resizing · thumbnails · virus scanning · CDN · websocket · notifications · AI moderation · OCR · video transcoding.

S1 v1.1 §13.14 / §16 defines exactly two Uploads endpoints:

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| POST | `/uploads/grants` | P | Request upload grant |
| POST | `/uploads/confirmations` | P | Confirm completed upload |

S1 §14.24 `UploadGrantRequest`: `purpose` · `contentType` · `byteSize`.  
S1 §14.25 `UploadConfirmRequest`: `grantId` · `storageKey`.  
S1 §15.13 `UploadGrantResponse`: `grantId` · `uploadUrl` · `storageKey` · `expiresAt` · `headers`.  
Confirm returns a media id usable in create DTOs (`UploadResponse`).

**Stub grant URL:** `uploadUrl` is a short-lived local stub (`https://upload.gmrlog.local/put/...`) — no cloud secrets (S3 not mounted).

---

## 1. Files created

### Backend — `apps/backend/src/uploads/`

| File | Role |
| ---- | ---- |
| `uploads.module.ts` | Domain module · DI · exports `UPLOAD_REPOSITORY` |
| `uploads.tokens.ts` | DI tokens |
| `uploads.service.ts` | Grant registration · confirm · ownership · soft expiry |
| `uploads.controller.ts` | S1 §13.14 routes (`@Controller('uploads')`) |
| `dto/uploads.dto.ts` | `UploadGrantDto` · `UploadConfirmDto` |
| `mappers/upload.mapper.ts` | → `UploadGrantResponse` / `UploadResponse` |
| `testing/fake-repositories.ts` | Test fakes |
| `uploads.service.spec.ts` · `uploads.controller.spec.ts` | Tests |

### Packages

| File | Change |
| ---- | ------ |
| `packages/database/.../upload.repository.ts` | `create` · `findById` · `findByOwnerAndId` · `updateStatus` · `listByOwner` |
| `packages/database/.../repositories/index.ts` | upload export |
| `packages/database/.../repositories.spec.ts` | `UploadRepository` ownership · status |
| `packages/types/src/index.ts` | `UploadPurposeValue` · `UploadStatusValue` · `UploadGrantResponse` · `UploadResponse` |
| `packages/validators/src/index.ts` | `uploadGrantSchema` · `uploadConfirmSchema` · soft MIME/byte allowlists · `UPLOAD_GRANT_TTL_MS` |

`app.module.ts` mounts `UploadsModule`.

---

## 2. Endpoint summary

| Method | Path | Auth | Behavior |
| ------ | ---- | ---- | -------- |
| POST | `/uploads/grants` | P | Creates `granted` Upload · returns `UploadGrantResponse` |
| POST | `/uploads/confirmations` | P | Owner + matching `storageKey` · status → `confirmed` · returns `UploadResponse` |

- `JwtAuthGuard` — guests **401**.
- Soft expiry: TTL from `createdAt` + `UPLOAD_GRANT_TTL_MS` (15m); stale confirm → status `expired` · **409**.
- Foreign grant → **404** (ownership). Already confirmed → **409**. Mismatched `storageKey` → **400**.

---

## 3. Repository summary

**UploadRepository** (`PrismaUploadRepository`) — persistence only:

| Responsibility | Detail |
| -------------- | ------ |
| `create` | Persist grant row |
| `findById` / `findByOwnerAndId` | Load · ownership-scoped lookup |
| `updateStatus` | Transition status |
| `listByOwner` | Owner uploads newest-first |

No storage I/O · no soft-delete column on S2 Upload.

---

## 4. Service summary

- **createGrant** — active user · persist `granted` · stub `uploadUrl` · `headers['Content-Type']` · `expiresAt`.
- **confirmUpload** — owner check · storageKey echo · TTL soft expiry · `confirmed` projection.

No S3 put · no virus scan · no resize · no CDN.

---

## 5. Validation summary

| Schema | Rules |
| ------ | ----- |
| `uploadGrantSchema` | `purpose`: closed enum; `contentType`: soft MIME allowlist; `byteSize`: positive int · max per purpose |
| `uploadConfirmSchema` | `grantId`: opaque id; `storageKey`: trimmed 1–512 |
| Soft MIME | `image/jpeg` · `image/png` · `image/webp` · `image/gif` |
| Soft max bytes | avatar 5MiB · banner/community_banner 10MiB · post/message_media 15MiB |

Invalid MIME / oversized → **400**.

---

## 6. Test summary

- **Repository:** create · owner find · foreign miss · status confirm · listByOwner
- **Service:** grant dialect · missing user · confirm · foreign **404** · bad storageKey · double-confirm **409** · expiry
- **Controller:** guest **401** · grant envelope · MIME/size **400** · confirm envelope · missing grant **404**
- Backend coverage — **287/287** tests
- Database coverage — **52/52** tests

---

## 7. Verification

`pnpm build` ✅ · `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ · `pnpm format:check` ✅

---

## 8. Deferred (D2.19+)

- Real object storage (S3 / signed PUT)
- Image resize · thumbnails · virus scan · CDN
- Wire `avatarUploadId` / `mediaUploadIds` consumers to confirmed uploads (prior domains unchanged)
- Async `processing` media variants (F6.6)
- Websocket · notifications · AI moderation · OCR · video transcoding

---

## Lock statement

**D2.18 Uploads Domain Foundation is LOCKED.**  
**D2.19 was not started.**
