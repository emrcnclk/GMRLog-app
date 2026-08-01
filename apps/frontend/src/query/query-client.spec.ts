import { describe, expect, it } from 'vitest';

import { getNextPageParam, mapQueryError } from './query-client';
import { FrontendApiError } from '../api/axios-client';

describe('mapQueryError', () => {
  it('maps FrontendApiError fields', () => {
    const mapped = mapQueryError(new FrontendApiError('nope', 404, null, 'req_9'));
    expect(mapped).toMatchObject({ message: 'nope', status: 404, requestId: 'req_9' });
  });
});

describe('getNextPageParam', () => {
  it('returns next cursor when present', () => {
    expect(getNextPageParam({ cursor: { next: 'abc' }, hasMore: true })).toBe('abc');
    expect(getNextPageParam({ hasMore: false, cursor: { next: 'abc' } })).toBeUndefined();
  });
});
