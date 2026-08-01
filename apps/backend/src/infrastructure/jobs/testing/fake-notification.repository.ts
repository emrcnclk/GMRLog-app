import type { NotificationRepository } from '@gmrlog/database';
import { vi } from 'vitest';

export interface FakeNotificationRepository extends NotificationRepository {
  deleteReadOlderThan: ReturnType<typeof vi.fn<(cutoff: Date) => Promise<number>>>;
}

export function createFakeNotificationRepository(): FakeNotificationRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    listForUser: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    countUnread: vi.fn(),
    deleteReadOlderThan: vi.fn(() => Promise.resolve(3)),
  } as unknown as FakeNotificationRepository;
}
