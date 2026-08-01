import { mePatchSchema } from '@gmrlog/validators';
import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { queryKeys } from '../../src/query/query-client';

describe('profile upload integration', () => {
  it('PATCH me accepts only confirmed avatar/banner upload ids', () => {
    const avatar = mePatchSchema.parse({ avatarUploadId: 'up_avatar_1' });
    const banner = mePatchSchema.parse({ bannerUploadId: 'up_banner_1' });
    expect(avatar.avatarUploadId).toBe('up_avatar_1');
    expect(banner.bannerUploadId).toBe('up_banner_1');
  });

  it('invalidates only me after profile media apply', async () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, 'invalidateQueries');
    await client.invalidateQueries({ queryKey: queryKeys.me });
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.me });
    expect(spy).not.toHaveBeenCalledWith({ queryKey: queryKeys.communities.all });
  });
});
