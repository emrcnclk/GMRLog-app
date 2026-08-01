import type { SearchHitType } from '@gmrlog/database';

/** Denormalized Meilisearch document — maps back to SearchHit projection. */
export interface MeiliSearchDocument {
  id: string;
  type: SearchHitType;
  orderedAt: string;
  visibility?: 'public' | 'followers' | 'private' | 'community';
  authorId?: string;
  ownerId?: string;
  title?: string;
  slug?: string;
  handle?: string;
  displayName?: string;
  body?: string;
  gameTitle?: string;
  description?: string;
  name?: string;
  kind?: string;
  /**
   * D3.25 — catalog enrichment surfaced in search results. `coverKey` is the
   * raw object-storage key, resolved to a URL at hit-consumption time
   * (search.mapper.ts), same as every other game-card projection.
   */
  coverKey?: string;
  genres?: string[];
}

export type MeiliIndexKey =
  'games' | 'users' | 'posts' | 'reviews' | 'collections' | 'tier_lists' | 'communities' | 'events';

export const MEILI_INDEX_KEYS: readonly MeiliIndexKey[] = [
  'games',
  'users',
  'posts',
  'reviews',
  'collections',
  'tier_lists',
  'communities',
  'events',
];

export const MEILI_INDEX_SETTINGS: Readonly<
  Record<MeiliIndexKey, { searchableAttributes: string[] }>
> = {
  // D3.25.1 — 'description'/'genres' carry catalog enrichment so it's
  // actually searchable, not just re-indexed with the same three fields.
  games: { searchableAttributes: ['title', 'slug', 'description', 'genres'] },
  users: { searchableAttributes: ['handle', 'displayName'] },
  posts: { searchableAttributes: ['body'] },
  reviews: { searchableAttributes: ['body', 'gameTitle'] },
  collections: { searchableAttributes: ['title', 'description'] },
  tier_lists: { searchableAttributes: ['title'] },
  communities: { searchableAttributes: ['name', 'description'] },
  events: { searchableAttributes: ['title'] },
};

export const SEARCH_HIT_TYPE_TO_MEILI_INDEX: Readonly<Record<SearchHitType, MeiliIndexKey>> = {
  game: 'games',
  user: 'users',
  post: 'posts',
  review: 'reviews',
  collection: 'collections',
  'tier-list': 'tier_lists',
  community: 'communities',
  event: 'events',
};
