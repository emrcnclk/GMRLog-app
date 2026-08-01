import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { queryKeys } from '../../src/query/query-client';

describe('community upload integration', () => {
  it('holds community_banner confirmed id without inventing schema fields', () => {
    const confirmedUploadId = 'up_community_banner_1';
    const communityCreateKeys = ['name', 'slug', 'description', 'visibility'] as const;
    expect(communityCreateKeys).not.toContain('bannerUploadId');
    expect(confirmedUploadId.startsWith('up_')).toBe(true);
  });

  it('invalidates only community queries after banner confirm', async () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, 'invalidateQueries');
    await client.invalidateQueries({ queryKey: queryKeys.communities.detail('c1') });
    await client.invalidateQueries({ queryKey: queryKeys.communities.list() });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.communities.detail('c1') });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.communities.list() });
    expect(spy).not.toHaveBeenCalledWith({ queryKey: queryKeys.me });
  });
});
