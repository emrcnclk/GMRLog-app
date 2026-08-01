import { describe, expect, it } from 'vitest';

import { queryKeys } from '../../../src/query/query-client';
import { restoreDetailAfterFailedDelete } from '../../../src/hardening/query-audit';

describe('D3.16 delete mutation detail rollback', () => {
  it('uses detail keys that match query factory', () => {
    expect(queryKeys.communities.detail('c1')).toEqual(['communities', 'detail', 'c1']);
    expect(queryKeys.collections.detail('col1')).toEqual(['collections', 'detail', 'col1']);
    expect(queryKeys.tierLists.detail('t1')).toEqual(['tierLists', 'detail', 't1']);
    expect(queryKeys.posts.detail('p1')).toEqual(['posts', 'detail', 'p1']);
    expect(queryKeys.reviews.detail('r1')).toEqual(['reviews', 'detail', 'r1']);
  });

  it('restores detail entity after failed optimistic delete', () => {
    const cache = new Map<string, { id: string; title: string }>();
    const previous = { id: 'c1', title: 'Guild' };
    const key = queryKeys.communities.detail('c1').join('.');
    restoreDetailAfterFailedDelete(cache, key, previous);
    expect(cache.get(key)).toEqual(previous);
  });
});
