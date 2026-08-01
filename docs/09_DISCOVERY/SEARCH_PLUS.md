# Search++ (D3.22)

**Status:** Additive to existing Meili search surface  
**Authority:** `docs/08_API/SEARCH_API.yaml` · `SEARCH_PLATFORM_FREEZE_v1`

## Entity types (query `types` multi)

| Type | Index / source |
|------|----------------|
| `games` | Existing |
| `collections` | Public collections |
| `tier_lists` | Public tier lists |
| `users` | Public profiles |
| `communities` | Public communities |
| `events` | Upcoming/public events |
| `achievements` | Achievement definitions |
| `tags` | Genre/tag vocabulary (genres as tags proxy) |
| `posts` | *(D3.24 planned)* Public posts index |
| `reviews` | *(D3.24 planned if not already wired)* Public reviews |
| `guides` | *(D3.24 planned)* Guide post subtype |

D3.22 expands validators + search service filters; does not replace Meili architecture.

D3.24 Search++ target vocabulary: Posts · Users · Communities · Events · Games · Reviews · Collections · Guides.
