import { describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';

import { createJobPayload } from '../job-payload';
import { JOB_SEARCH_INDEX_DELETE, JOB_SEARCH_INDEX_UPSERT } from '../job-names';
import { SearchIndexProcessor } from './search-index.processor';

describe('SearchIndexProcessor', () => {
  const searchIndex = {
    upsert: vi.fn(),
    delete: vi.fn(),
  };
  const processor = new SearchIndexProcessor(searchIndex as never);

  it('supports upsert and delete job names', () => {
    expect(processor.supports(JOB_SEARCH_INDEX_UPSERT)).toBe(true);
    expect(processor.supports(JOB_SEARCH_INDEX_DELETE)).toBe(true);
    expect(processor.supports('other')).toBe(false);
  });

  it('routes upsert and delete actions', async () => {
    const upsertJob = {
      data: createJobPayload(
        { action: 'upsert', type: 'game', id: 'game-1' },
        { idempotencyKey: 'search:upsert:game:game-1' },
      ),
    } as Job;
    await processor.process(upsertJob);
    expect(searchIndex.upsert).toHaveBeenCalledWith('game', 'game-1');

    const deleteJob = {
      data: createJobPayload(
        { action: 'delete', type: 'post', id: 'post-1' },
        { idempotencyKey: 'search:delete:post:post-1' },
      ),
    } as Job;
    await processor.process(deleteJob);
    expect(searchIndex.delete).toHaveBeenCalledWith('post', 'post-1');
  });
});
