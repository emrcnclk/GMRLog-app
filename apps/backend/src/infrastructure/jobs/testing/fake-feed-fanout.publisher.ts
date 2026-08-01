import { vi } from 'vitest';

import { FeedFanoutPublisher } from '../feed-fanout.publisher';
import type { FeedFanoutInput } from '../feed-fanout.service';

export interface FakeFeedFanoutPublisher {
  publish: ReturnType<typeof vi.fn<(input: FeedFanoutInput) => Promise<void>>>;
  calls: FeedFanoutInput[];
}

export function createFakeFeedFanoutPublisher(): FakeFeedFanoutPublisher {
  const calls: FeedFanoutInput[] = [];
  const publish = vi.fn((input: FeedFanoutInput) => {
    calls.push(input);
    return Promise.resolve();
  });
  return { publish, calls };
}

export function asFeedFanoutPublisher(fake: FakeFeedFanoutPublisher): FeedFanoutPublisher {
  return fake as unknown as FeedFanoutPublisher;
}
