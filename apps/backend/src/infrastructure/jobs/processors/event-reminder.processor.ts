import type {
  EventParticipationRepository,
  EventRepository,
  NotificationRepository,
} from '@gmrlog/database';
import { Inject, Injectable } from '@nestjs/common';
import type { Job } from 'bullmq';

import type { EventReminderJobData } from '../event-reminder.publisher';
import { JOB_EVENT_REMINDER } from '../job-names';
import type { JobPayload } from '../job-payload';
import {
  WORKER_EVENT_PARTICIPATION_REPOSITORY,
  WORKER_EVENT_REPOSITORY,
  WORKER_NOTIFICATION_REPOSITORY,
} from '../worker.tokens';

const NOTIFICATION_KIND_EVENT_REMINDER = 'event_reminder';

/** RSVP states that still expect a reminder when the job fires. */
const REMINDABLE_STATES = new Set(['going', 'hosting', 'looking_for_team']);

/**
 * Creates `event_reminder` notifications for scheduled RSVP reminders (D3.24).
 */
@Injectable()
export class EventReminderProcessor {
  constructor(
    @Inject(WORKER_NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepository,
    @Inject(WORKER_EVENT_REPOSITORY) private readonly events: EventRepository,
    @Inject(WORKER_EVENT_PARTICIPATION_REPOSITORY)
    private readonly participations: EventParticipationRepository,
  ) {}

  supports(jobName: string): boolean {
    return jobName === JOB_EVENT_REMINDER;
  }

  async process(job: Job<JobPayload<EventReminderJobData>>): Promise<void> {
    const { eventId, userId } = job.data.data;

    const event = await this.events.findActiveById(eventId);
    if (event === null) {
      return;
    }

    const participation = await this.participations.findByEventAndUser(eventId, userId);
    if (participation === null || !REMINDABLE_STATES.has(participation.state)) {
      return;
    }

    await this.notifications.create({
      recipient: { connect: { id: userId } },
      kind: NOTIFICATION_KIND_EVENT_REMINDER,
      objectType: 'event',
      objectId: eventId,
    });
  }
}
