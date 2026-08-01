# Wishlist++ Metadata (D3.22)

**Status:** LOCKED  
**Table:** `wishlist_metadata` (1:1 with `library_entries` where status can be wishlist)

## Priority — `WishlistPriority`

| Member |
|--------|
| `low` |
| `medium` |
| `high` |
| `must_play` |

Default: `medium`.

## Wait status — `WishlistWaitStatus`

| Member |
|--------|
| `none` |
| `waiting_sale` |
| `waiting_dlc` |
| `waiting_translation` |
| `waiting_release` |

## Notes

Free-text `notes` (nullable). Library `note` remains separate shelf note.

## API

`PATCH /me/library/:gameId/wishlist-meta` — upsert metadata for wishlist (or owned) entries.  
`GET` projections include metadata when present.
