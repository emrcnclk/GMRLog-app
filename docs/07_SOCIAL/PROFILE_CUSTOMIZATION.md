# Profile Customization (D3.27 · D3.29)

**Document:** `docs/07_SOCIAL/PROFILE_CUSTOMIZATION.md`
**Status:** **SHIPPED, synced** — `accent`/`cardStyle`/`bannerStyle`/`favoritePlatform`/`consoleGeneration`/widget layout round-trip through `/me/profile-theme` (3b.6, `packages/design_handoff_dna_match_and_community/SCREEN_REDESIGNS_2.md` §18). `heroStyle` is the one field that stays device-local — see "Scope" below for why.
**Authority:** F2.5 · [`PROFILE_V2.md`](./PROFILE_V2.md) · [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) "Digital Home"

---

## Mission

"This is my place." A profile should express identity, not render a template.

---

## Scope of this release

Every field in the stored shape below except `heroStyle` is synced through
`GET|PATCH /me/profile-theme` (3b.6's Customize Profile screen,
`apps/frontend/features/profile/screens/customize-profile-screen.tsx`), backed
by `UserSettings` columns added in D3.29. Consequences, stated plainly:

- Preferences **do** follow a player to another device.
- Preferences are **not yet** visible to other players viewing the profile —
  `GET /users/{id}/profile-theme` exists and is tested
  (`apps/backend/src/users/user-profile-theme.controller.ts`), but no frontend
  screen reads it yet. Real, working backend surface with no caller yet, not a
  placeholder — flagged so a future dead-route sweep doesn't need to
  rediscover why it exists.
- `heroStyle` (§6's record-card / monolith / banner switch) has no server
  column: it was added after this doc's stored shape was written, still lives
  only in `AsyncStorage` under `gmrlog.profile.customization.v1`
  (`use-profile-customization.ts`), and is edited on the same Customize
  Profile screen without being part of the PATCH body.
- Device-local storage is still the *read* path the rest of the app uses
  (`useCustomizationStore`) — the Customize screen writes through to it only
  after a confirmed server save, so profile-screen.tsx and friends keep
  reading synchronously rather than every consumer switching to the query.

The stored shape below was written to match the server resource before the
resource existed, which is exactly why wiring it up (3b.6) was a
persistence-adapter swap rather than a redesign — the intent that motivated
writing it that way held up.

---

## Stored shape

```jsonc
{
  "accent": "plasma",              // AccentKey — remaps color.accent.* only
  "cardStyle": "elevated",         // elevated | flat | outlined
  "bannerStyle": "artwork",        // artwork | gradient | solid
  "favoritePlatform": "PC",        // closed preference vocabulary, not derived
  "consoleGeneration": "gen9",     // retro | gen6 | gen7 | gen8 | gen9 | pc | handheld
  "widgetOrder": ["archetypes", "insights", "…"],
  "pinnedWidgets": ["achievements"],
  "hiddenWidgets": ["backlog"]
}
```

Parsing is total: malformed JSON, unknown enum members and unknown widget ids
all degrade to defaults rather than throwing. A corrupt preferences blob must
never stop a profile from rendering.

---

## Accent contract

An accent remaps **`color.accent.default` · `color.accent.muted` ·
`color.accent.onAccent` and nothing else.** Scheme neutrals, status colours and
rarity colours are untouched.

This is enforced by `packages/ui/src/theme/accent.spec.ts`, which asserts that
for every accent, in both schemes, every non-accent token is byte-identical to
the neutral palette. Choosing an accent therefore cannot degrade contrast
anywhere else in the app.

`neutral` is the default and reproduces the frozen monochrome design system
exactly.

---

## Widgets

Closed vocabulary. Unknown ids in stored state are dropped on load; widgets added
in a later release are appended at their default position, so shipping a new
widget never leaves an existing player unable to see it.

| Widget | Source |
|--------|--------|
| `archetypes` | `GET /me/archetypes` |
| `insights` | `GET /me/statistics` |
| `heatmap` | `GET /me/statistics/history` |
| `achievements` | `GET /me/achievements` |
| `currently-playing` · `recently-finished` · `wishlist` · `backlog` | `GET /library/entries` |
| `collections` | `GET /me/collections` |
| `activity` | profile activity feed |

Effective order = pinned widgets first (preserving relative order), hidden
widgets removed.

### Reordering and accessibility

Reordering is offered as **both** press-and-hold drag *and* explicit up/down
controls. Drag alone is unusable with switch control, keyboard, or a screen
reader, so the buttons are the accessible path — not a fallback. Every control
carries an explicit `accessibilityLabel` naming the widget it acts on.

---

## Backend follow-ups

| Need | Status |
|------|--------|
| `GET /me/profile-theme` | **Shipped, D3.29.** Owner view, includes `profileVisibility`. |
| `PATCH /me/profile-theme` | **Shipped, D3.29.** Partial patch, `null` clears nullable fields. |
| `GET /users/{id}/profile-theme` | **Shipped, D3.29**, but no frontend consumer — see "Scope" above. |
| A screen that reads the public projection | **Open.** `PublicProfileScreen` doesn't show another player's theme yet. |
| `User.country` | **Open**, unrelated to this section — required before the PROFILE_V2 hero can show country at all. |

The profile hero deliberately omits country rather than fabricating one until
that last row exists.
