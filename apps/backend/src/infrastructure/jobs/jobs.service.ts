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
    if (this.connection.status !== 'ready' && this.connection.status !== 'connecting') {
      void this.connection.connect();
    }
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
