import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventReminderPublisher } from './event-reminder.publisher';
import { JOB_EVENT_REMINDER } from './job-names';
import { QUEUE_NOTIFICATIONS } from './queue-names';

describe('EventReminderPublisher', () => {
  let add: ReturnType<typeof vi.fn>;
  let getJob: ReturnType<typeof vi.fn>;
  let remove: ReturnType<typeof vi.fn>;
  let jobs: { getQueue: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    remove = vi.fn().mockResolvedValue(undefined);
    getJob = vi.fn().mockResolvedValue(undefined);
    add = vi.fn().mockResolvedValue(undefined);
    jobs = {
      getQueue: vi.fn().mockReturnValue({ add, getJob }),
    };
  });

  it('no-ops when jobs service is unavailable', async () => {
    const publisher = new EventReminderPublisher(null);
    await publisher.schedule('e1', 'u1', new Date(Date.now() + 3_600_000 * 2));
    await publisher.cancel('e1', 'u1');
  });

  it('schedules a delayed reminder far enough in the future', async () => {
    const publisher = new EventReminderPublisher(jobs as never);
    const startsAt = new Date(Date.now() + 3 * 3_600_000);
    await publisher.schedule('event-1', 'user-1', startsAt);
    expect(jobs.getQueue).toHaveBeenCalledWith(QUEUE_NOTIFICATIONS);
    expect(add).toHaveBeenCalledWith(
      JOB_EVENT_REMINDER,
      expect.objectContaining({
        data: { eventId: 'event-1', userId: 'user-1' },
      }),
      expect.objectContaining({ delay: expect.any(Number) }),
    );
  });

  it('replaces an existing job before scheduling', async () => {
    getJob.mockResolvedValue({ remove });
    const publisher = new EventReminderPublisher(jobs as never);
    await publisher.schedule('event-1', 'user-1', new Date(Date.now() + 5 * 3_600_000));
    expect(remove).toHaveBeenCalled();
    expect(add).toHaveBeenCalled();
  });

  it('cancels when startsAt is too soon', async () => {
    const publisher = new EventReminderPublisher(jobs as never);
    await publisher.schedule('event-1', 'user-1', new Date(Date.now() + 60_000));
    expect(add).not.toHaveBeenCalled();
    expect(getJob).toHaveBeenCalled();
  });

  it('cancels by removing an existing job', async () => {
    getJob.mockResolvedValue({ remove });
    const publisher = new EventReminderPublisher(jobs as never);
    await publisher.cancel('event-1', 'user-1');
    expect(remove).toHaveBeenCalled();
  });

  it('swallows enqueue and cancel failures', async () => {
    add.mockRejectedValue(new Error('redis down'));
    getJob.mockRejectedValue('boom');
    const publisher = new EventReminderPublisher(jobs as never);
    await publisher.schedule('event-1', 'user-1', new Date(Date.now() + 5 * 3_600_000));
    await publisher.cancel('event-1', 'user-1');
  });
});
