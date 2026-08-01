import type { SearchHit } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import { routeForSearchHit, searchHitKey } from '../hooks/search-model';

describe('SearchResultCard navigation contract', () => {
  const hits: SearchHit[] = [
    { type: 'game', id: 'g1', summary: { title: 'Game', slug: 'game' } },
    { type: 'user', id: 'u1', summary: { handle: 'nova', displayName: 'Nova' } },
    { type: 'review', id: 'r1', summary: { excerpt: 'great', gameTitle: 'Game' } },
    { type: 'post', id: 'p1', summary: { excerpt: 'hello' } },
    { type: 'collection', id: 'c1', summary: { title: 'Best Of' } },
    { type: 'tier-list', id: 't1', summary: { title: 'S Tier' } },
    { type: 'community', id: 'co1', summary: { name: 'Guild' } },
    { type: 'event', id: 'e1', summary: { title: 'Lan', kind: 'community' } },
  ];

  it('covers every SearchHit type with a destination', () => {
    for (const hit of hits) {
      expect(routeForSearchHit(hit)).not.toBeNull();
      expect(searchHitKey(hit)).toContain(hit.type);
    }
  });

  it('preserves backend order in keys', () => {
    expect(hits.map((hit) => searchHitKey(hit))).toEqual([
      'game:g1',
      'user:u1',
      'review:r1',
      'post:p1',
      'collection:c1',
      'tier-list:t1',
      'community:co1',
      'event:e1',
    ]);
  });
});
