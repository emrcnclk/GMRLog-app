import { describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';

import { AppLogger } from '../../logging/app-logger.service';
import { createJobPayload } from '../job-payload';
import { JOB_MAINTENANCE_NOTIFICATION_CLEANUP } from '../job-names';
import { NotificationCleanupProcessor } from './notification-cleanup.processor';
import { createFakeNotificationRepository } from '../testing/fake-notification.repository';

describe('NotificationCleanupProcessor', () => {
  it('deletes read notifications older than 90 days', async () => {
    const notifications = createFakeNotificationRepository();
    const logger = {
      event: vi.fn(),
    } as unknown as AppLogger;
    const processor = new NotificationCleanupProcessor(notifications, logger);

    const job = {
      name: JOB_MAINTENANCE_NOTIFICATION_CLEANUP,
      data: createJobPayload({}, { idempotencyKey: 'test' }),
    } as Job;

    await processor.process(job);

    expect(notifications.deleteReadOlderThan).toHaveBeenCalledOnce();
    const cutoff = notifications.deleteReadOlderThan.mock.calls[0]?.[0] as Date;
    const ageMs = Date.now() - cutoff.getTime();
    expect(ageMs).toBeGreaterThan(89 * 24 * 60 * 60 * 1000);
    expect(ageMs).toBeLessThan(91 * 24 * 60 * 60 * 1000);
  });
});
