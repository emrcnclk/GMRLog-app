import { vi } from 'vitest';

import { JobsService } from '../jobs.service';

/**
 * A job a spec's code under test tried to enqueue, captured instead of sent.
 */
export interface RecordedJob {
  queue: string;
  name: string;
  data: unknown;
}

export interface FakeJobsService {
  /** Every enqueue attempt, in order, across every queue. */
  jobs: RecordedJob[];
  getQueue: ReturnType<typeof vi.fn<(name: string) => { add: FakeQueueAdd }>>;
}

type FakeQueueAdd = (name: string, data: unknown, options?: unknown) => Promise<{ id: string }>;

/**
 * In-memory stand-in for `JobsService`.
 *
 * Overriding `JOBS_CONNECTION` with a bare object is **not** enough to keep a
 * controller suite off the developer's Redis, and the failure is silent.
 * `getQueue()` passes that object to `new Queue(name, { connection })`, and
 * BullMQ only treats `connection` as a client when it looks like one — a stub
 * such as `{ disconnect: () => undefined }` is read as connection *options*
 * instead, so BullMQ builds its own ioredis client from them and defaults to
 * `localhost:6379`. `uploads.controller.spec.ts` was doing exactly that: with
 * the local container up it enqueued a real `bull:media:media.image.process-*`
 * job on every run and passed; with the container down its confirm test hung
 * on the connect retry and reported nothing but `Test timed out in 5000ms`.
 *
 * Override the service, not the connection, so no queue is ever constructed.
 */
export function createFakeJobsService(): FakeJobsService {
  const jobs: RecordedJob[] = [];
  return {
    jobs,
    getQueue: vi.fn((queue: string) => ({
      add: (name: string, data: unknown) => {
        jobs.push({ queue, name, data });
        return Promise.resolve({ id: `fake-job-${String(jobs.length)}` });
      },
    })),
  };
}

export function asJobsService(fake: FakeJobsService): JobsService {
  return fake as unknown as JobsService;
}
