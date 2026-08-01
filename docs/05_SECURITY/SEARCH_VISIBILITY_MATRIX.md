# Search Visibility Matrix

**Document:** `docs/05_SECURITY/SEARCH_VISIBILITY_MATRIX.md`  
**Status:** **Frozen — Search Platform Freeze v1.0** (Sprint 11.0)

---

## Visibility classes

| Class | Meaning |
|-------|---------|
| Public searchable | Appears in anon + auth keyword search |
| Viewer-aware | Appears only if viewer may see entity under domain ACL |
| Suppressed | Matched by query but **omitted** from results |
| Snapshot-safe | SERP card fields never leak private titles/bodies |

---

## Entity rules (MVP)

### Games

| Condition | Result |
|-----------|--------|
| Published / catalog-searchable (Games BC rules) | Include |
| Unpublished / deleted | Suppress |
| Adult / region gates (if Games defines) | Follow Games BC |

### Users

| Condition | Result |
|-----------|--------|
| `searchVisibility === PUBLIC` and active | Include |
| `searchVisibility` not PUBLIC | Suppress |
| Suspended user | Suppress |
| Soft-deleted / missing profile | Suppress |
| Authenticated viewer has block either way | Suppress for that viewer |
| Private profile fields | SERP uses minimal public card only |

### Reviews

| Condition | Result |
|-----------|--------|
| Published + visibility PUBLIC | Include for anon |
| FOLLOWERS / PRIVATE | Include only if viewer passes Reviews visibility |
| Soft-deleted / hidden / moderated hide | Suppress |
| Spoiler body | Do not dump full spoiler text in SERP; use safe snippet / flag per Reviews rules |

### Collections

| Condition | Result |
|-----------|--------|
| `visibility === PUBLIC` and not deleted | Include (matches current entity search) |
| FOLLOWERS / PRIVATE | Suppress from default Search MVP |
| Soft-deleted | Suppress |

### Lists

| Condition | Result |
|-----------|--------|
| PUBLIC + not deleted | Include |
| Non-public | Suppress from default Search MVP |
| Soft-deleted | Suppress |

### Tier Lists

| Condition | Result |
|-----------|--------|
| PUBLIC + not deleted | Include |
| Non-public | Suppress from default Search MVP |
| Soft-deleted | Suppress |

---

## Cross-cutting suppression

| Condition | Result |
|-----------|--------|
| Soft-deleted entity | Suppress |
| Suspended owner (UGC) when domain requires | Suppress or strip per domain |
| Empty query / below min length | No results (validation) |
| Type not in MVP allowlist | Ignore type |

---

## Discover visibility

Discover sections must only compose **already public** domain discovery endpoints (featured/trending/public browse). Do not invent private “for you” shelves in V1.

---

## Trending / recent visibility

| Surface | Rule |
|---------|------|
| Recent | Private to user; never used to build other users’ SERPs |
| Trending queries | Public strings only after aggregation; strip queries that are exact usernames of non-searchable users when feasible; moderation hooks later |

---

## North Star notes

- Gaming culture discovery over generic people-search spam.  
- Quiet suppression &gt; leaking private reviews or hidden profiles.  
- Block respect is part of “digital home” trust.
