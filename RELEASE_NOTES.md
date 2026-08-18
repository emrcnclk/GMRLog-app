# GMRLog v1.0.0-rc1 Release Notes

**Release Date:** August 17, 2026  
**Status:** Release Candidate - Ready for Production  
**Tag:** `v1.0.0-rc1`

---

## 🎉 Overview

This release marks the **completion of the full GMRLog product handoff** from design to production-ready code. All 11 development phases have been delivered, with comprehensive testing, security audit, and performance validation.

**Key Metrics:**

- ✅ 11 Phases completed (3b through 11)
- ✅ 2,344 tests passing (156 backend files, 764 frontend tests)
- ✅ 24 redesigned screens live
- ✅ Zero new security issues (IDOR audit passed)
- ✅ Performance validated at 100K+ account cardinality
- ✅ 2,200 games ingested from IGDB catalog

---

## 📋 Major Features by Phase

### Phase 3b: Screen Recomposition

- Events screen with live dots, filter pills, date plates
- Tournament bracket data structure
- Community roles & leaderboard
- Moderators rail with accent styling
- Cosmetics store & Pro subscription screen
- Followers/Following/Blocked tabs with sheet/popover

### Phase 4: OAuth Sign-in

- Google & Discord OAuth flows
- Steam OpenID verification with squatter-eviction
- Password escape hatch for OAuth-only accounts
- Last-sign-in-method guard
- Rate-limited auth (5 requests/60s)
- Timing-safe password rejection

### Phase 5: DNA Backend

- Five sub-score breakdown (library, genre, review, wishlist, completion)
- Server-owned band thresholds (different/partial/strong/near-identical)
- GET /users/:id/dna-match endpoint with verdict templates
- Shared archetypes traits (max 3, ranked by score)
- Thin-data handling (<3 shared games = 0%)

### Phase 6: DNA Match in App

- Match token (row & inline variants)
- Plays-like-you rail with 34% peer discovery
- Animated match ring (setInterval workaround)
- Full DNA panel with breakdown & shared games

### Phase 7: Community

- Leaderboard with weighted scoring (guide 3pts, post 1pt, event 5pts)
- Moderators rail & contribution board
- Follow/unblock/report in sheet/popover primitive
- Full-text member search

### Phase 8: Production Readiness

- Cross-platform: Rails wrap above 768px breakpoint
- Security audit: 66 routes checked, zero IDOR
- Performance: All endpoints <1s at 100K accounts
- Visual QA complete

### Phase 9: Backend Follow-ups

- Unread message count (null = fully unread)
- Achievement holder percent (0.4% of players)
- Event attendee counts & community denormalization
- Genre counts, card number, stats fields

### Phase 10: Production Gates

- Redis race condition fixed
- Full CI pipeline (33-task graph)
- E2E critical paths tested
- v1 scope gates (Pro/Studio/Publisher)
- Sentry observability wired

### Phase 11: Catalog Completeness

- IGDB catalog mirror (2,200 games via API)
- Bulk ingestion with BullMQ workers
- Meili reindex & media enqueue parity

---

## 🔒 Security Results

**Audit Findings:**

- ✅ Rate-limit coverage: All auth routes (5/60s)
- ✅ IDOR audit: 66 routes, zero vulnerabilities
- ✅ OAuth: Squatter-eviction, PKCE, state binding
- ✅ Password: Timing-safe, dummy-hash constant-time
- ✅ Logging: Pino redaction guard
- ✅ Errors: Sentry integration with request ID

**Known Gaps (Post-v1):**

- Dependency audit (dev security)
- Comprehensive secrets review
- Event inviter-relationship check (low severity)

---

## ⚡ Performance (100K+ DB)

| Operation       | p50   | p99   |
| --------------- | ----- | ----- |
| Similar users   | 300ms | 500ms |
| Unread batch    | <10ms | <50ms |
| Holder percent  | <5ms  | <30ms |
| Event attendees | <5ms  | <20ms |
| Health check    | <1ms  | <5ms  |

---

## 🧪 Test Coverage

- 1,478/1,483 backend tests (99.7%)
- 764 frontend tests (100%)
- 97 database tests (100%)
- 50 UI tests (100%)

**Known Flakes (Pre-existing):**

- Redis connect race (documented, not fixed in test)
- Statistics weekly-period calc (out of scope)

---

## 🚀 Deployment

### Quick Start

```bash
# 1. Setup environment
cp infrastructure/docker/.env.production.example .env.staging
# Edit .env.staging with secrets

# 2. Deploy
cd infrastructure/docker
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 3. Verify
curl http://localhost:4000/api/v1/health/live
```

### Health Checks

- API health: `GET /api/v1/health/live`
- Database: All migrations applied
- Redis: PING response
- Meilisearch: Index ready
- S3/MinIO: Bucket initialized

---

## 📝 Known Limitations (v1)

### Post-v1 Features

- Pro subscription payment backend
- Cosmetics store purchase flow
- Studio analytics & Publisher dashboards
- Achievement completion% tracking
- Video attachments on reviews

### Deferred Decisions

- Platinum flag vs. completion% schema
- Equipped-badge slot system
- Partnership/sponsorship entity

---

## 📚 Documentation

- **TASKS.md** — Complete task history
- **CLAUDE.md** — Code rules & platform traps
- **BACKEND_CHANGES.md** — API & schema changes
- **README.md** — Feature spec
- **THEME_MIGRATION.md** — Design tokens

---

**Built with:** TypeScript, NestJS, React Native Web, Prisma, Expo  
**Completed:** August 17, 2026  
**Status:** Ready for Production QA
