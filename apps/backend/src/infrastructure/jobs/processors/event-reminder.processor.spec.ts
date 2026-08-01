import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';

import type { EventReminderJobData } from '../event-reminder.publisher';
import { createJobPayload } from '../job-payload';
import { JOB_EVENT_REMINDER } from '../job-names';
import { EventReminderProcessor } from './event-reminder.processor';

describe('EventReminderProcessor', () => {
  const notifications = {
    create: vi.fn().mockResolvedValue({}),
  };
  const events = {
    findActiveById: vi.fn(),
  };
  const participations = {
    findByEventAndUser: vi.fn(),
  };
  let processor: EventReminderProcessor;

  beforeEach(() => {
    notifications.create.mockClear();
    events.findActiveById.mockReset();
    participations.findByEventAndUser.mockReset();
    processor = new EventReminderProcessor(
      notifications as never,
      events as never,
      participations as never,
    );
  });

  it('supports event.reminder', () => {
    expect(processor.supports(JOB_EVENT_REMINDER)).toBe(true);
  });

  it('creates event_reminder when RSVP is still remindable', async () => {
    events.findActiveById.mockResolvedValue({ id: 'event-1' });
    participations.findByEventAndUser.mockResolvedValue({ state: 'going' });

    await processor.process({
      name: JOB_EVENT_REMINDER,
      data: createJobPayload<EventReminderJobData>(
        { eventId: 'event-1', userId: 'user-1' },
        { idempotencyKey: 'event.reminder:event-1:user-1' },
      ),
    } as Job);

    expect(notifications.create).toHaveBeenCalledWith({
      recipient: { connect: { id: 'user-1' } },
      kind: 'event_reminder',
      objectType: 'event',
      objectId: 'event-1',
    });
  });

  it('skips when participation is no longer remindable', async () => {
    events.findActiveById.mockResolvedValue({ id: 'event-1' });
    participations.findByEventAndUser.mockResolvedValue({ state: 'not_going' });

    await processor.process({
      name: JOB_EVENT_REMINDER,
      data: createJobPayload<EventReminderJobData>(
        { eventId: 'event-1', userId: 'user-1' },
        { idempotencyKey: 'event.reminder:event-1:user-1' },
      ),
    } as Job);

    expect(notifications.create).not.toHaveBeenCalled();
  });
});
