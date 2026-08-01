import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppLogger } from '../logging/app-logger.service';
import { parseBackendEnv } from '../config/env.schema';
import { SearchIndexService } from '../search/search-index.service';

import { JOB_SEARCH_INDEX_DELETE, JOB_SEARCH_INDEX_UPSERT } from './job-names';
import { JobsService } from './jobs.service';
import { SearchIndexPublisher } from './search-index.publisher';
import { QUEUE_SEARCH_INDEX } from './queue-names';

describe('SearchIndexPublisher', () => {
  let searchIndex: SearchIndexService;
  let logger: AppLogger;

  beforeEach(() => {
    searchIndex = {
      upsert: vi.fn(),
      delete: vi.fn(),
    } as unknown as SearchIndexService;
    logger = new AppLogger(parseBackendEnv({}));
  });

  it('indexes synchronously when jobs service is unavailable', async () => {
    const publisher = new SearchIndexPublisher(searchIndex, logger, null);
    await publisher.publishUpsert('game', 'game-1');
    await publisher.publishDelete('user', 'user-1');
    expect(searchIndex.upsert).toHaveBeenCalledWith('game', 'game-1');
    expect(searchIndex.delete).toHaveBeenCalledWith('user', 'user-1');
  });

  it('enqueues upsert and delete jobs when redis is available', async () => {
    const add = vi.fn().mockResolvedValue(undefined);
    const jobs = { getQueue: vi.fn().mockReturnValue({ add }) } as unknown as JobsService;
    const publisher = new SearchIndexPublisher(searchIndex, logger, jobs);

    await publisher.publishUpsert('post', 'post-1');
    await publisher.publishDelete('review', 'review-1');

    expect(jobs.getQueue).toHaveBeenCalledWith(QUEUE_SEARCH_INDEX);
    expect(add).toHaveBeenCalledWith(
      JOB_SEARCH_INDEX_UPSERT,
      expect.objectContaining({ data: { action: 'upsert', type: 'post', id: 'post-1' } }),
      expect.objectContaining({ jobId: 'search.index-upsert-post-post-1' }),
    );
    expect(add).toHaveBeenCalledWith(
      JOB_SEARCH_INDEX_DELETE,
      expect.objectContaining({ data: { action: 'delete', type: 'review', id: 'review-1' } }),
      expect.objectContaining({ jobId: 'search.index-delete-review-review-1' }),
    );
  });

  it('falls back to synchronous indexing when enqueue fails', async () => {
    const add = vi.fn().mockRejectedValue(new Error('queue unavailable'));
    const jobs = { getQueue: vi.fn().mockReturnValue({ add }) } as unknown as JobsService;
    const publisher = new SearchIndexPublisher(searchIndex, logger, jobs);

    await publisher.publishUpsert('game', 'game-2');
    expect(searchIndex.upsert).toHaveBeenCalledWith('game', 'game-2');
  });
});
