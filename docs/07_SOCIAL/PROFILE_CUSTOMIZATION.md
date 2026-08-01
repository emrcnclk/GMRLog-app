# Profile Customization (D3.27)

**Document:** `docs/07_SOCIAL/PROFILE_CUSTOMIZATION.md`
**Status:** **SHIPPED (device-local)** — server sync pending backend unfreeze
**Authority:** F2.5 · [`PROFILE_V2.md`](./PROFILE_V2.md) · [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) "Digital Home"

---

## Mission

"This is my place." A profile should express identity, not render a template.

---

## Scope of this release

Customization ships **device-local**. GMRLOG has no customization columns, and
the backend is under FEATURE FREEZE (`CHANGELOG.md` → Known limitations), so
preferences persist through `AsyncStorage` under `gmrlog.profile.customization.v1`.

Consequences, stated plainly:

- Preferences do **not** follow a player to another device.
- Preferences are **not** visible to other players viewing the profile.
- Clearing app storage resets them.

The stored shape is deliberately the shape a server resource would return, so
enabling sync is a persistence-adapter swap rather than a redesign.

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

To promote this to a synced, publicly-visible profile theme:

| Need | Shape |
|------|-------|
| `GET /me/profile-theme` | returns the stored shape above |
| `PATCH /me/profile-theme` | accepts a partial of the same shape |
| `GET /users/{id}/profile-theme` | public projection, so visitors see the player's theme |
| `User.country` | required before the PROFILE_V2 hero can show country at all |

Until those exist the client is the source of truth, and the profile hero
deliberately omits country rather than fabricating one.
