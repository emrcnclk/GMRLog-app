import { randomUUID } from 'node:crypto';

import { Injectable, Logger, Optional } from '@nestjs/common';

import { toBullJobId } from './bull-job-id';
import { JOB_EVENT_REMINDER } from './job-names';
import { createJobPayload } from './job-payload';
import { JobsService } from './jobs.service';
import { QUEUE_NOTIFICATIONS } from './queue-names';

/** Reminder fires this many ms before `startsAt`. */
export const EVENT_REMINDER_LEAD_MS = 60 * 60 * 1000;

export interface EventReminderJobData {
  eventId: string;
  userId: string;
}

/**
 * Schedules delayed event reminder notifications (D3.24 EVENTS_V2).
 * Skips gracefully when Redis / JobsService is unavailable.
 */
@Injectable()
export class EventReminderPublisher {
  private readonly logger = new Logger(EventReminderPublisher.name);

  constructor(@Optional() private readonly jobs: JobsService | null) {}

  /**
   * Schedule (or reschedule) a reminder for RSVP states that expect one.
   * No-op when `startsAt` is not far enough in the future.
   */
  async schedule(eventId: string, userId: string, startsAt: Date): Promise<void> {
    if (this.jobs == null) {
      return;
    }

    const reminderAt = startsAt.getTime() - EVENT_REMINDER_LEAD_MS;
    const delay = reminderAt - Date.now();
    if (delay <= 0) {
      await this.cancel(eventId, userId);
      return;
    }

    const idempotencyKey = `event.reminder:${eventId}:${userId}`;
    const jobId = toBullJobId(idempotencyKey);
    const payload = createJobPayload<EventReminderJobData>(
      { eventId, userId },
      { correlationId: randomUUID(), idempotencyKey },
    );

    try {
      const queue = this.jobs.getQueue(QUEUE_NOTIFICATIONS);
      const existing = await queue.getJob(jobId);
      if (existing !== undefined) {
        await existing.remove();
      }
      await queue.add(JOB_EVENT_REMINDER, payload, {
        jobId,
        delay,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 86_400, count: 1000 },
        removeOnFail: false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`event.reminder.enqueue.failed: ${message}`);
    }
  }

  /** Drop a pending reminder (leave / decline / non-remindable state). */
  async cancel(eventId: string, userId: string): Promise<void> {
    if (this.jobs == null) {
      return;
    }

    const jobId = toBullJobId(`event.reminder:${eventId}:${userId}`);
    try {
      const existing = await this.jobs.getQueue(QUEUE_NOTIFICATIONS).getJob(jobId);
      if (existing !== undefined) {
        await existing.remove();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`event.reminder.cancel.failed: ${message}`);
    }
  }
}
