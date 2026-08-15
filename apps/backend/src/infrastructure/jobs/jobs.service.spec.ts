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

  it("never calls connect() itself — that's ioredis's own 'connect' status BullMQ's Queue already brings up race-safe (10.1)", () => {
    // 'connect' is the real ioredis status between the TCP handshake landing
    // and the 'ready' event firing — not 'wait', not 'connecting', not
    // 'ready'. A hand-rolled guard checking only the latter two lets a
    // second connect() through here, which ioredis rejects with "Redis is
    // already connecting/connected" (see race-repro.spec.ts for the real
    // ioredis + real BullMQ reproduction). getQueue() must never call
    // connect() itself for any status — `new Queue(...)` already does.
    const connection = { disconnect: vi.fn(), status: 'connect', connect: vi.fn() };
    const service = new JobsService(connection as never);

    service.getQueue('maintenance');

    expect(connection.connect).not.toHaveBeenCalled();
  });
});
