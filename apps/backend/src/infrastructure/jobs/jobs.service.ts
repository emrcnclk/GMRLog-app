import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';

import { JOBS_CONNECTION } from './jobs.constants';

/**
 * BullMQ bootstrap surface. No queues exist yet — domains obtain queues here
 * after authoritative decisions (F6.3 §5.4). Connection is lazy; Redis absence
 * does not block boot.
 */
@Injectable()
export class JobsService implements OnApplicationShutdown {
  private readonly queues = new Map<string, Queue>();

  constructor(@Inject(JOBS_CONNECTION) private readonly connection: Redis) {}

  getQueue(name: string): Queue {
    const existing = this.queues.get(name);
    if (existing) return existing;
    // `new Queue(...)` already brings the shared connection up via BullMQ's
    // own RedisConnection/waitUntilReady, which is race-safe: it checks
    // status once and either calls connect() (only from 'wait') or awaits
    // the 'ready'/'error'/'end' events. A second, hand-rolled connect() call
    // here raced that internal one — ioredis's own 'connect' status (the
    // instant between TCP connect and the 'ready' event) isn't 'ready' or
    // 'connecting', so this guard let a second connect() through during that
    // window, and ioredis throws "Redis is already connecting/connected" —
    // as an unhandled rejection, since the call was fire-and-forget. Found
    // by reproducing the exact race directly against ioredis + a real BullMQ
    // Worker sharing this connection (10.1).
    const queue = new Queue(name, { connection: this.connection });
    this.queues.set(name, queue);
    return queue;
  }

  async onApplicationShutdown(): Promise<void> {
    await Promise.all([...this.queues.values()].map((queue) => queue.close()));
    this.queues.clear();
    this.connection.disconnect();
  }
}
