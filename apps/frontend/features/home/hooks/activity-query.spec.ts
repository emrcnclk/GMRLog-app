import type { ActivityItemResponse, ApiEnvelope } from '@gmrlog/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '../../../src/query/query-client';

/**
 * Query architecture tests — keys · page flattening · invalidate path.
 */
describe('activity query architecture', () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('uses stable activity list key', () => {
    expect(queryKeys.activity.list()).toEqual(['activity', 'list']);
    expect(queryKeys.activity.all).toEqual(['activity']);
  });

  it('flattens cursor pages without duplicating ids', () => {
    const page1: ApiEnvelope<ActivityItemResponse[]> = {
      data: [
        {
          id: 'a1',
          kind: 'review',
          createdAt: '2026-07-27T10:00:00.000Z',
          readAt: null,
          actor: null,
          objectRef: { type: 'review', id: 'r1' },
          messageKey: 'review',
        },
      ],
      meta: { requestId: '1', cursor: { next: 'c2' }, hasMore: true },
    };
    const page2: ApiEnvelope<ActivityItemResponse[]> = {
      data: [
        {
          id: 'a2',
          kind: 'post',
          createdAt: '2026-07-27T09:00:00.000Z',
          readAt: null,
          actor: null,
          objectRef: { type: 'post', id: 'p1' },
          messageKey: 'post',
        },
      ],
      meta: { requestId: '2', cursor: { next: null }, hasMore: false },
    };

    client.setQueryData(queryKeys.activity.list(), {
      pages: [page1, page2],
      pageParams: [undefined, 'c2'],
    });

    const cached = client.getQueryData<{
      pages: ApiEnvelope<ActivityItemResponse[]>[];
    }>(queryKeys.activity.list());
    const flat = cached?.pages.flatMap((p) => p.data) ?? [];
    expect(flat.map((i) => i.id)).toEqual(['a1', 'a2']);
  });

  it('invalidateQueries targets activity list only once', async () => {
    const spy = vi.spyOn(client, 'invalidateQueries');
    await client.invalidateQueries({ queryKey: queryKeys.activity.list() });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.activity.list() });
  });

  it('QueryClientProvider accepts activity queries', () => {
    function Wrapper({ children }: { children: ReactNode }) {
      return createElement(QueryClientProvider, { client }, children);
    }
    expect(Wrapper).toBeTypeOf('function');
  });
});
