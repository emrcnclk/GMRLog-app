import type { SearchHitType } from '@gmrlog/database';
import { vi } from 'vitest';

import { SearchIndexPublisher } from '../search-index.publisher';

export interface FakeSearchIndexPublisher {
  publishUpsert: ReturnType<typeof vi.fn<(type: SearchHitType, id: string) => Promise<void>>>;
  publishDelete: ReturnType<typeof vi.fn<(type: SearchHitType, id: string) => Promise<void>>>;
}

export function createFakeSearchIndexPublisher(): FakeSearchIndexPublisher {
  return {
    publishUpsert: vi.fn(() => Promise.resolve()),
    publishDelete: vi.fn(() => Promise.resolve()),
  };
}

export function asSearchIndexPublisher(fake: FakeSearchIndexPublisher): SearchIndexPublisher {
  return fake as unknown as SearchIndexPublisher;
}
