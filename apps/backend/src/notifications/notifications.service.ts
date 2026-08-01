import type { NotificationListCursor, NotificationRepository } from '@gmrlog/database';
import type { NotificationResponse } from '@gmrlog/types';
import type { NotificationListQueryInput, NotificationsReadInput } from '@gmrlog/validators';
import { NOTIFICATION_LIST_DEFAULT_LIMIT } from '@gmrlog/validators';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PaginatedPayload } from '../infrastructure/http/paginated-payload';

import { toNotificationResponse } from './mappers/notification.mapper';
import { NOTIFICATION_REPOSITORY } from './notifications.tokens';

/**
 * Notification domain service (F6.3 / D2.10). Recipient-owned list + mark-read.
 * Create/generation lives in social domains (comments · reactions · friends · …).
 * No websocket · push · email · feed.
 *
 * Documented product kinds (string `Notification.kind`):
 * friend_request · friend_accepted · achievement_unlocked · comment · reply ·
 * like · collection_follow · community_activity · tier_list_interaction ·
 * review_interaction
 */
@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepository,
  ) {}

  async listNotifications(
    recipientId: string,
    query: NotificationListQueryInput = {},
  ): Promise<PaginatedPayload<NotificationResponse>> {
    const limit = query.limit ?? NOTIFICATION_LIST_DEFAULT_LIMIT;
    const cursor = query.cursor !== undefined ? decodeCursor(query.cursor) : undefined;
    const from = query.from !== undefined ? new Date(query.from) : undefined;
    const to = query.to !== undefined ? new Date(query.to) : undefined;

    const rows = await this.notifications.listByUser(recipientId, {
      limit: limit + 1,
      ...(cursor !== undefined ? { cursor } : {}),
      ...(from !== undefined ? { from } : {}),
      ...(to !== undefined ? { to } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const next =
      hasMore && last !== undefined
        ? encodeCursor({ createdAt: last.createdAt, id: last.id })
        : null;

    return new PaginatedPayload(page.map(toNotificationResponse), { next }, hasMore, limit);
  }

  /**
   * S1 §13.11 / §14.22 — mark by ids or all. Already-read timestamps are preserved
   * by the repository (update only when `readAt` is null).
   */
  async markRead(recipientId: string, input: NotificationsReadInput): Promise<void> {
    if (input.all === true) {
      await this.notifications.markAllRead(recipientId);
      return;
    }

    const ids = input.ids ?? [];
    await this.requireOwnedIds(recipientId, ids);
    await this.notifications.markManyRead(recipientId, ids);
  }

  private async requireOwnedIds(recipientId: string, ids: readonly string[]): Promise<void> {
    for (const id of ids) {
      const row = await this.notifications.findById(id);
      if (row?.recipientId !== recipientId) {
        throw new NotFoundException('Notification not found');
      }
    }
  }
}

function encodeCursor(cursor: NotificationListCursor): string {
  const payload = `${cursor.createdAt.toISOString()}|${cursor.id}`;
  return Buffer.from(payload, 'utf8').toString('base64url');
}

function decodeCursor(raw: string): NotificationListCursor {
  let decoded: string;
  try {
    decoded = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
  const separator = decoded.indexOf('|');
  if (separator <= 0) {
    throw new BadRequestException('Invalid cursor');
  }
  const createdAtRaw = decoded.slice(0, separator);
  const id = decoded.slice(separator + 1);
  const createdAt = new Date(createdAtRaw);
  if (Number.isNaN(createdAt.getTime()) || id.length === 0) {
    throw new BadRequestException('Invalid cursor');
  }
  return { createdAt, id };
}
