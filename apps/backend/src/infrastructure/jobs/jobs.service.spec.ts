import { beforeEach, describe, expect, it, vi } from 'vitest';

const { close, Queue } = vi.hoisted(() => {
  const close = vi.fn().mockResolvedValue(undefined);
  class QueueMock {
    name: string;
    close = close;
    constructor(name: string) {
      this.name = name;
    }
  }
  return { close, Queue: QueueMock };
});

vi.mock('bullmq', () => ({ Queue }));

import { JobsService } from './jobs.service';

describe('JobsService', () => {
  beforeEach(() => {
    close.mockClear();
  });

  it('reuses queue instances and closes them on shutdown', async () => {
    const connection = { disconnect: vi.fn(), status: 'ready', connect: vi.fn() };
    const service = new JobsService(connection as never);
    const first = service.getQueue('maintenance');
    const second = service.getQueue('maintenance');

    expect(first).toBe(second);

    await service.onApplicationShutdown();
    expect(close).toHaveBeenCalledOnce();
    expect(connection.disconnect).toHaveBeenCalledOnce();
  });
});
