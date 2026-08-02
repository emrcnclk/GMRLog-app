# Copy-paste prompts

One session per phase. After each phase: review the diff, run the checks, commit, then `/clear` before the next one.

`/clear` matters — a fresh context per phase keeps the model from dragging Phase 1's decisions into Phase 4.

---

## Phase 0 — sanity check (Opus)

```
Read design_handoff_dna_match_and_community/README.md, THEME_MIGRATION.md and
BACKEND_CHANGES.md. Then explore this repo and tell me where the docs are wrong
or out of date — files that moved, assumptions that don't hold, work that's
already done. Don't change any code yet. Just a list.
```

Read the answer. If it contradicts the docs, trust the repo and adjust before continuing.

---

## Phase 1 — visual language (Sonnet)

```
Read design_handoff_dna_match_and_community/THEME_MIGRATION.md and apply it.

Values only. Do not restructure the token system, do not touch any feature code,
do not add tokens beyond the two typography fields the doc names.

When done, run: pnpm turbo run typecheck lint test
Fix anything the palette change broke.
```

Then look at it yourself:

```bash
pnpm --filter frontend exec expo start --web
```

Walk Home, Game hub, Profile, Achievements, Settings — in dark, light, and with the `neutral` accent.

```bash
git add -A && git commit -m "feat(ui): adopt navy surface + hairline visual language"
```

---

## Phase 2 — backend breakdown (Sonnet)

```
Read design_handoff_dna_match_and_community/BACKEND_CHANGES.md sections 1 to 3
and implement them.

computeUserSimilarityScore must keep its exact current signature and behaviour —
add the breakdown alongside it and have the total delegate to it. Add a test
asserting the weighted sum of the parts equals the total.

Create the Prisma migration but do not run it against any database — show me the
command.
```

```bash
pnpm --filter @gmrlog/database exec prisma migrate dev --name user_similarity_breakdown
pnpm turbo run test --filter=backend
git commit -am "feat(discover): expose user similarity breakdown"
```

---

## Phase 3 — match token (Sonnet)

```
Read design_handoff_dna_match_and_community/README.md, sections "Friends /
followers list" and "Community detail".

Build features/dna-match/components/dna-match-token.tsx as ONE shared component
and use it in all four places: similar-users-section.tsx, the friends list rows,
community-member-card.tsx, and the Discover rail (rail comes in phase 5 — just
export it ready).

Do not duplicate the markup per surface. No raw hex — tokens only.
```

```bash
git commit -am "feat(social): surface DNA match on people lists"
```

---

## Phase 4 — the DNA panel (Opus)

```
Read design_handoff_dna_match_and_community/BACKEND_CHANGES.md section 4 and the
README section "Player screen — DNA match".

Build the endpoint first, then the panel.

Constraints:
- The panel mounts INSIDE the existing PublicProfileScreen, between the identity
  block and ProfileStatsGrid. Do not create a new screen — the route and screen
  already exist.
- The ring is react-native-svg. There is no conic-gradient in React Native.
- Use DistributionBars from @gmrlog/ui for the five breakdown rows. Do not write
  new bar markup.
- Handle all four states: loading, organisation account (panel omitted entirely),
  thin data, blocked.

Show me your plan before you write code.
```

```bash
git commit -am "feat(profile): gamer DNA match panel"
```

---

## Phase 5 — Discover rail (Sonnet)

```
Read design_handoff_dna_match_and_community/README.md section "Discover — Plays
like you rail" and build it.

useSimilarUsers already returns the data — this is a card treatment, not a new
data pipeline. Reuse the ring component from phase 4 at 52px.
```

```bash
git commit -am "feat(discover): plays-like-you rail"
```

---

## Phase 6 — community members (Sonnet)

```
Read design_handoff_dna_match_and_community/BACKEND_CHANGES.md section 5 and the
README section "Community detail — Members tab".

Three stacked sections in one scroll: moderators rail, contribution board, top
members. Reuse the existing community-member-card and empty-members components.

Check community-permissions.ts first — roles may already be modelled.
```

```bash
git commit -am "feat(communities): moderators, contribution board, member match"
```

---

## Review prompt (Opus, after any phase)

```
Review the diff on this branch against
design_handoff_dna_match_and_community/THEME_MIGRATION.md and README.md.

Flag: raw hex values, hand-rolled components that duplicate something in
@gmrlog/ui, accent used as a filled background, new screens where the doc said
extend an existing one, and anything that breaks on the neutral accent.

Don't fix anything. Just the list.
```

---

## Final

```bash
pnpm turbo run typecheck lint test build
pnpm --filter frontend exec expo start        # i / a for native
pnpm --filter frontend exec expo start --web
```
