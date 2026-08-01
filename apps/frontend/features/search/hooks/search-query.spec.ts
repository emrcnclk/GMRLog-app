import type { ApiEnvelope, SearchHit } from '@gmrlog/types';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getNextPageParam, queryKeys } from '../../../src/query/query-client';
import { SEARCH_DEBOUNCE_MS } from '../hooks/search-model';

describe('search query architecture', () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('uses query-scoped keys and 300ms debounce policy', () => {
    expect(SEARCH_DEBOUNCE_MS).toBe(300);
    expect(queryKeys.search.results('hollow')).toEqual(['search', 'results', 'hollow']);
  });

  it('paginates with cursor meta only', () => {
    expect(getNextPageParam({ cursor: { next: 'c2' }, hasMore: true })).toBe('c2');
    expect(getNextPageParam({ cursor: { next: 'c2' }, hasMore: false })).toBeUndefined();
  });

  it('flattens pages without reordering hits', () => {
    const page1: ApiEnvelope<SearchHit[]> = {
      data: [
        { type: 'game', id: 'g1', summary: { title: 'A', slug: 'a' } },
        { type: 'user', id: 'u1', summary: { handle: 'p', displayName: 'P' } },
      ],
      meta: { requestId: '1', cursor: { next: 'c2' }, hasMore: true },
    };
    const page2: ApiEnvelope<SearchHit[]> = {
      data: [{ type: 'post', id: 'p1', summary: { excerpt: 'hello' } }],
      meta: { requestId: '2', cursor: { next: null }, hasMore: false },
    };

    client.setQueryData(queryKeys.search.results('x'), {
      pages: [page1, page2],
      pageParams: [undefined, 'c2'],
    });

    const cached = client.getQueryData<{ pages: ApiEnvelope<SearchHit[]>[] }>(
      queryKeys.search.results('x'),
    );
    const flat = cached?.pages.flatMap((p) => p.data) ?? [];
    expect(flat.map((h) => h.type)).toEqual(['game', 'user', 'post']);
  });

  it('invalidates active search query once', async () => {
    const spy = vi.spyOn(client, 'invalidateQueries');
    await client.invalidateQueries({ queryKey: queryKeys.search.results('elden') });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
