import { describe, expect, it } from 'vitest';

import { toBullJobId } from './bull-job-id';

describe('toBullJobId', () => {
  it('replaces colons so BullMQ accepts the id', () => {
    expect(toBullJobId('media.image.process:abc')).toBe('media.image.process-abc');
    expect(toBullJobId('search.index:upsert:post:1')).toBe('search.index-upsert-post-1');
  });
});
