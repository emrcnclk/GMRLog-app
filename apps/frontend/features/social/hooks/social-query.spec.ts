import { describe, expect, it } from 'vitest';

import { queryKeys } from '../../../src/query/query-client';

describe('social query architecture (3b.3, 3b.3a)', () => {
  it('uses independent keys per tab, blocked included', () => {
    expect(queryKeys.social.followers()).toEqual(['social', 'followers']);
    expect(queryKeys.social.following()).toEqual(['social', 'following']);
    expect(queryKeys.social.blocked()).toEqual(['social', 'blocked']);
  });
});
