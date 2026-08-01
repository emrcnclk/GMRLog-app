import type {
  Notification,
  NotificationListParams,
  NotificationRepository,
  Prisma,
} from '@gmrlog/database';

/**
 * In-memory repository fakes — test support only (build-excluded).
 */

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${String(idCounter)}`;
}

function connectId(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('connect' in value)) {
    return undefined;
  }
  const connect = (value as { connect?: { id?: string } }).connect;
  return typeof connect?.id === 'string' ? connect.id : undefined;
}

export function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'notification-1',
    recipientId: 'user-1',
    kind: 'follow',
    objectType: 'user',
    objectId: 'user-x',
    readAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export interface FakeNotificationRepository extends NotificationRepository {
  rows: Map<string, Notification>;
}

export function createFakeNotificationRepository(
  seed: Notification[] = [],
): FakeNotificationRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));
  return {
    rows,
    create: (data: Prisma.NotificationCreateInput) => {
      const recipientId = connectId(data.recipient);
      if (!recipientId) {
        return Promise.reject(new Error('recipient required'));
      }
      const notification = makeNotification({
        id: nextId('notification'),
        recipientId,
        kind: data.kind,
        objectType: data.objectType,
        objectId: data.objectId,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      rows.set(notification.id, notification);
      return Promise.resolve(notification);
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    listByUser: (recipientId, params: NotificationListParams) => {
      let list = [...rows.values()]
        .filter((row) => row.recipientId === recipientId)
        .sort((a, b) => {
          const byTime = b.createdAt.getTime() - a.createdAt.getTime();
          return byTime !== 0 ? byTime : b.id.localeCompare(a.id);
        });
      if (params.from !== undefined) {
        const fromTime = params.from.getTime();
        list = list.filter((row) => row.createdAt.getTime() >= fromTime);
      }
      if (params.to !== undefined) {
        const toTime = params.to.getTime();
        list = list.filter((row) => row.createdAt.getTime() <= toTime);
      }
      if (params.cursor !== undefined) {
        const cursor = params.cursor;
        const cursorTime = cursor.createdAt.getTime();
        list = list.filter((row) => {
          const time = row.createdAt.getTime();
          return time < cursorTime || (time === cursorTime && row.id < cursor.id);
        });
      }
      return Promise.resolve(list.slice(0, params.limit));
    },
    markRead: (id) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.resolve(null);
      }
      if (current.readAt != null) {
        return Promise.resolve(current);
      }
      const next: Notification = {
        ...current,
        readAt: new Date(),
        updatedAt: new Date(),
      };
      rows.set(id, next);
      return Promise.resolve(next);
    },
    markAllRead: (recipientId) => {
      let count = 0;
      const now = new Date();
      for (const [id, row] of rows) {
        if (row.recipientId === recipientId && row.readAt == null) {
          rows.set(id, { ...row, readAt: now, updatedAt: now });
          count += 1;
        }
      }
      return Promise.resolve(count);
    },
    markManyRead: (recipientId, ids) => {
      let count = 0;
      const now = new Date();
      const idSet = new Set(ids);
      for (const [id, row] of rows) {
        if (row.recipientId === recipientId && idSet.has(id) && row.readAt == null) {
          rows.set(id, { ...row, readAt: now, updatedAt: now });
          count += 1;
        }
      }
      return Promise.resolve(count);
    },
    delete: (id) => {
      const current = rows.get(id);
      if (!current) {
        return Promise.reject(new Error(`notification ${id} not found`));
      }
      rows.delete(id);
      return Promise.resolve(current);
    },
    deleteReadOlderThan: (cutoff) => {
      let count = 0;
      for (const [id, row] of rows) {
        if (row.readAt != null && row.readAt.getTime() < cutoff.getTime()) {
          rows.delete(id);
          count += 1;
        }
      }
      return Promise.resolve(count);
    },
  };
}
