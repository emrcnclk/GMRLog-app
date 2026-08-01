import type {
  BlockRepository,
  NotificationRepository,
  PostRepository,
  QuoteRepository,
  User,
  UserRepository,
} from '@gmrlog/database';
import type { QuoteResponse } from '@gmrlog/types';
import type { QuoteCreateInput } from '@gmrlog/validators';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { BLOCK_REPOSITORY } from '../blocks/blocks.tokens';
import { FeedFanoutPublisher } from '../infrastructure/jobs/feed-fanout.publisher';
import { toUserPublicResponse } from '../posts/mappers/post.mapper';
import { POST_REPOSITORY } from '../posts/posts.tokens';

import {
  QUOTE_NOTIFICATION_REPOSITORY,
  QUOTE_REPOSITORY,
  QUOTE_USER_REPOSITORY,
} from './quotes.tokens';

const NOTIFICATION_KIND_QUOTE = 'quote';

/** D3.24 Quote System v2 — multi-target quotes. */
@Injectable()
export class QuotesService {
  constructor(
    @Inject(QUOTE_REPOSITORY) private readonly quotes: QuoteRepository,
    @Inject(QUOTE_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(POST_REPOSITORY) private readonly posts: PostRepository,
    @Inject(BLOCK_REPOSITORY) private readonly blocks: BlockRepository,
    @Inject(QUOTE_NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepository,
    private readonly feedFanout: FeedFanoutPublisher,
  ) {}

  async createQuote(authorId: string, input: QuoteCreateInput): Promise<QuoteResponse> {
    await this.assertTargetExists(input.targetType, input.targetId);
    const ownerId = await this.resolveTargetOwner(input.targetType, input.targetId);
    if (ownerId !== null) {
      if (
        (await this.blocks.exists(authorId, ownerId)) ||
        (await this.blocks.exists(ownerId, authorId))
      ) {
        throw new BadRequestException('Cannot quote across a block');
      }
    }

    const created = await this.quotes.create({
      author: { connect: { id: authorId } },
      targetType: input.targetType,
      targetId: input.targetId,
      body: input.body,
      visibility: input.visibility ?? 'public',
    });

    await this.feedFanout.publish({
      kind: 'post',
      actorId: authorId,
      objectType: 'post',
      objectId: created.id,
      occurredAt: created.createdAt,
    });

    if (ownerId !== null && ownerId !== authorId) {
      await this.notifications.create({
        recipient: { connect: { id: ownerId } },
        kind: NOTIFICATION_KIND_QUOTE,
        objectType: mapQuoteObjectType(input.targetType),
        objectId: input.targetId,
      });
    }

    const author = await this.requireUser(authorId);
    return {
      id: created.id,
      author: toUserPublicResponse(author),
      targetType: created.targetType,
      targetId: created.targetId,
      body: created.body,
      visibility: created.visibility,
      createdAt: created.createdAt.toISOString(),
    };
  }

  private async assertTargetExists(
    type: QuoteCreateInput['targetType'],
    id: string,
  ): Promise<void> {
    if (type === 'post' || type === 'screenshot' || type === 'guide') {
      const post = await this.posts.findActiveById(id);
      if (!post) {
        throw new NotFoundException('Quote target not found');
      }
    }
  }

  private async resolveTargetOwner(
    type: QuoteCreateInput['targetType'],
    id: string,
  ): Promise<string | null> {
    if (type === 'post' || type === 'screenshot' || type === 'guide') {
      const post = await this.posts.findActiveById(id);
      return post?.authorId ?? null;
    }
    return null;
  }

  private async requireUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}

/** Notification objectType projection for quote targets (D3.24). */
export function mapQuoteObjectType(
  type: QuoteCreateInput['targetType'],
): 'post' | 'review' | 'collection' | 'tier_list' | 'achievement' {
  switch (type) {
    case 'review':
      return 'review';
    case 'collection':
      return 'collection';
    case 'tier_list':
      return 'tier_list';
    case 'achievement':
      return 'achievement';
    default:
      return 'post';
  }
}
