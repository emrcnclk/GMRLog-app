import { describe, expect, it } from 'vitest';

import type { SearchHitRecord } from '@gmrlog/database';

import { excerptText, SEARCH_EXCERPT_MAX, toSearchHit } from './search.mapper';
import { GAME_CATALOG_DEFAULTS } from '../../games/game-catalog.defaults';

const orderedAt = new Date('2026-01-01T00:00:00.000Z');

describe('search.mapper', () => {
  it('truncates long excerpts', () => {
    const long = 'x'.repeat(SEARCH_EXCERPT_MAX + 10);
    expect(excerptText(long).length).toBe(SEARCH_EXCERPT_MAX);
    expect(excerptText('  short  ')).toBe('short');
  });

  it('maps every search hit record type', () => {
    const records: SearchHitRecord[] = [
      {
        type: 'game',
        id: 'game-1',
        orderedAt,
        game: {
          id: 'game-1',
          title: 'Hollow',
          slug: 'hollow',
          coverKey: null,
          releaseDate: null,
          featured: false,
          popularity: 0,
          franchiseId: null,
          createdAt: orderedAt,
          updatedAt: orderedAt,
          ...GAME_CATALOG_DEFAULTS,
        },
      },
      {
        type: 'user',
        id: 'user-1',
        orderedAt,
        user: {
          id: 'user-1',
          handle: 'player',
          displayName: 'Player',
          bio: null,
          avatarKey: null,
          bannerKey: null,
          avatarBlurhash: null,
          avatarVariants: null,
          bannerBlurhash: null,
          bannerVariants: null,
          privacyId: null,
          firstName: null,
          lastName: null,
          birthDate: null,
          countryCode: null,
          creatorFeatured: false,
          accountKind: 'individual',
          cardNumber: 1,
          createdAt: orderedAt,
          updatedAt: orderedAt,
          deletedAt: null,
        },
      },
      {
        type: 'review',
        id: 'review-1',
        orderedAt,
        review: {
          id: 'review-1',
          authorId: 'user-1',
          gameId: 'game-1',
          rating: 5,
          body: 'Great game',
          containsSpoilers: false,
          visibility: 'public',
          version: 1,
          createdAt: orderedAt,
          updatedAt: orderedAt,
          deletedAt: null,
        },
        game: {
          id: 'game-1',
          title: 'Hollow',
          slug: 'hollow',
          coverKey: null,
          releaseDate: null,
          featured: false,
          popularity: 0,
          franchiseId: null,
          createdAt: orderedAt,
          updatedAt: orderedAt,
          ...GAME_CATALOG_DEFAULTS,
        },
      },
      {
        type: 'post',
        id: 'post-1',
        orderedAt,
        post: {
          id: 'post-1',
          authorId: 'user-1',
          gameId: null,
          communityId: null,
          body: 'Hello world',
          visibility: 'public',
          postKind: 'text' as const,
          containsSpoilers: false,
          pinnedAt: null,
          createdAt: orderedAt,
          updatedAt: orderedAt,
          deletedAt: null,
        },
      },
      {
        type: 'collection',
        id: 'collection-1',
        orderedAt,
        collection: {
          id: 'collection-1',
          ownerId: 'user-1',
          title: 'Favorites',
          description: null,
          visibility: 'public',
          type: 'manual',
          ruleKey: null,
          bannerKey: null,
          coverKey: null,
          color: null,
          tags: [],
          version: 1,
          createdAt: orderedAt,
          updatedAt: orderedAt,
          deletedAt: null,
        },
      },
      {
        type: 'tier-list',
        id: 'tier-1',
        orderedAt,
        tierList: {
          id: 'tier-1',
          ownerId: 'user-1',
          title: '2026',
          visibility: 'public',
          version: 1,
          createdAt: orderedAt,
          updatedAt: orderedAt,
          deletedAt: null,
        },
      },
      {
        type: 'community',
        id: 'community-1',
        orderedAt,
        community: {
          id: 'community-1',
          name: 'Culture',
          slug: 'culture',
          description: null,
          visibility: 'public',
          avatarKey: null,
          bannerKey: null,
          avatarBlurhash: null,
          avatarVariants: null,
          bannerBlurhash: null,
          bannerVariants: null,
          joinType: 'public' as const,
          kind: 'games' as const,
          tags: [],
          createdAt: orderedAt,
          updatedAt: orderedAt,
          deletedAt: null,
        },
      },
      {
        type: 'event',
        id: 'event-1',
        orderedAt,
        event: {
          id: 'event-1',
          title: 'Seasonal',
          kind: 'seasonal',
          description: null,
          gameId: null,
          communityId: null,
          startsAt: orderedAt,
          endsAt: null,
          createdAt: orderedAt,
          updatedAt: orderedAt,
          deletedAt: null,
        },
      },
    ];

    expect(toSearchHit(records[0]!)).toMatchObject({ type: 'game', summary: { title: 'Hollow' } });
    expect(toSearchHit(records[1]!)).toMatchObject({ type: 'user', summary: { handle: 'player' } });
    expect(toSearchHit(records[2]!)).toMatchObject({
      type: 'review',
      summary: { excerpt: 'Great game', gameTitle: 'Hollow' },
    });
    expect(toSearchHit(records[3]!)).toMatchObject({
      type: 'post',
      summary: { excerpt: 'Hello world' },
    });
    expect(toSearchHit(records[4]!)).toMatchObject({
      type: 'collection',
      summary: { title: 'Favorites' },
    });
    expect(toSearchHit(records[5]!)).toMatchObject({
      type: 'tier-list',
      summary: { title: '2026' },
    });
    expect(toSearchHit(records[6]!)).toMatchObject({
      type: 'community',
      summary: { name: 'Culture' },
    });
    expect(toSearchHit(records[7]!)).toMatchObject({
      type: 'event',
      summary: { title: 'Seasonal', kind: 'seasonal' },
    });
  });

  it('maps achievement hits with title as name', () => {
    expect(
      toSearchHit({
        type: 'achievement',
        id: 'ach-1',
        orderedAt,
        achievement: { id: 'ach-1', title: 'First Log', category: 'milestones' },
      }),
    ).toEqual({
      type: 'achievement',
      id: 'ach-1',
      summary: { name: 'First Log', category: 'milestones' },
    });
  });

  it('maps tag hits from genre proxy fields', () => {
    expect(
      toSearchHit({
        type: 'tag',
        id: 'genre-1',
        orderedAt,
        tag: { id: 'genre-1', name: 'Metroidvania', slug: 'metroidvania' },
      }),
    ).toEqual({
      type: 'tag',
      id: 'genre-1',
      summary: { name: 'Metroidvania', slug: 'metroidvania' },
    });
  });

  // D3.25 — catalog enrichment must be usable from a search hit
  // (docs/18_CATALOG/GAME_METADATA_ARCHITECTURE.md §6).
  describe('game hit — catalog enrichment', () => {
    it('resolves the cover key to a public URL and surfaces summary + genres', () => {
      const hit = toSearchHit({
        type: 'game',
        id: 'game-1',
        orderedAt,
        game: {
          id: 'game-1',
          title: 'Hades',
          slug: 'hades',
          coverKey: 'games/game-1/cover/abc.jpg',
          releaseDate: null,
          featured: false,
          popularity: 0,
          franchiseId: null,
          createdAt: orderedAt,
          updatedAt: orderedAt,
          ...GAME_CATALOG_DEFAULTS,
          summary: 'A rogue-like dungeon crawler.',
        },
        genres: ['Indie', 'Role-playing (RPG)'],
      });

      expect(hit).toMatchObject({
        type: 'game',
        summary: {
          title: 'Hades',
          slug: 'hades',
          summary: 'A rogue-like dungeon crawler.',
          genres: ['Indie', 'Role-playing (RPG)'],
        },
      });
      expect(
        (hit as { summary: { coverImageUrl: string | null } }).summary.coverImageUrl,
      ).toContain('games%2Fgame-1%2Fcover%2Fabc.jpg');
    });

    it('degrades to empty genres on the direct-Postgres fallback path', () => {
      // No `genres` key at all — exactly what searchGames() in
      // search.repository.ts returns when Meili is unavailable.
      const hit = toSearchHit({
        type: 'game',
        id: 'game-1',
        orderedAt,
        game: {
          id: 'game-1',
          title: 'Hades',
          slug: 'hades',
          coverKey: null,
          releaseDate: null,
          featured: false,
          popularity: 0,
          franchiseId: null,
          createdAt: orderedAt,
          updatedAt: orderedAt,
          ...GAME_CATALOG_DEFAULTS,
        },
      });

      expect(hit).toMatchObject({ type: 'game', summary: { genres: [], coverImageUrl: null } });
    });
  });
});
