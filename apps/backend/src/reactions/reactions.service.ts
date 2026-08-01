import type {
  CollectionRepository,
  CommentRepository,
  NotificationRepository,
  ObjectType,
  PostRepository,
  Reaction,
  ReactionRepository,
  ReactionTargetType,
  ReviewRepository,
  TierListRepository,
  User,
  UserRepository,
} from '@gmrlog/database';
import type { ReactionResponse } from '@gmrlog/types';
import type { ReactionCreateInput } from '@gmrlog/validators';
import { REACTION_KIND_LIKE } from '@gmrlog/validators';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { FeedFanoutPublisher } from '../infrastructure/jobs/feed-fanout.publisher';

import { toReactionResponse } from './mappers/reaction.mapper';
import {
  REACTION_COLLECTION_REPOSITORY,
  REACTION_COMMENT_REPOSITORY,
  REACTION_NOTIFICATION_REPOSITORY,
  REACTION_POST_REPOSITORY,
  REACTION_REPOSITORY,
  REACTION_REVIEW_REPOSITORY,
  REACTION_TIER_LIST_REPOSITORY,
  REACTION_USER_REPOSITORY,
} from './reactions.tokens';

/**
 * Reaction domain service (F6.3 / D2.6 / D3.21). Owns create + hard-delete, target
 * existence checks, and (actor, target, kind) uniqueness. On `like`, notifies
 * the target owner and fans out ActivityItem `like`.
 *
 * Kind replacement has no PATCH route (S1): clients DELETE the old row then
 * POST the new kind.
 */
@Injectable()
export class ReactionsService {
  constructor(
    @Inject(REACTION_REPOSITORY) private readonly reactions: ReactionRepository,
    @Inject(REACTION_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REACTION_POST_REPOSITORY) private readonly posts: PostRepository,
    @Inject(REACTION_REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
    @Inject(REACTION_COMMENT_REPOSITORY) private readonly comments: CommentRepository,
    @Inject(REACTION_COLLECTION_REPOSITORY) private readonly collections: CollectionRepository,
    @Inject(REACTION_TIER_LIST_REPOSITORY) private readonly tierLists: TierListRepository,
    @Inject(REACTION_NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepository,
    private readonly feedFanout: FeedFanoutPublisher,
  ) {}

  async createReaction(actorId: string, input: ReactionCreateInput): Promise<ReactionResponse> {
    const target = await this.requireActiveTarget(input.targetType, input.targetId);

    const duplicate = await this.reactions.findByActorAndTarget(
      actorId,
      input.targetType,
      input.targetId,
      input.kind,
    );
    if (duplicate) {
      throw new ConflictException('Reaction already exists for this target and kind');
    }

    const created = await this.reactions.create({
      actor: { connect: { id: actorId } },
      targetType: input.targetType,
      targetId: input.targetId,
      kind: input.kind,
    });

    if (input.kind === REACTION_KIND_LIKE) {
      await this.notifyLike({
        recipientId: target.ownerId,
        actorId,
        targetType: input.targetType,
        targetId: input.targetId,
      });
      await this.feedFanout.publish({
        kind: 'like',
        objectId: input.targetId,
        objectType: reactionTargetAsObjectType(input.targetType),
        actorId,
        occurredAt: created.createdAt,
      });
    }

    return this.project(created);
  }

  /**
   * S2 §13 — relationship rows hard-delete. Only the owning actor may remove.
   */
  async deleteReaction(reactionId: string, actorId: string): Promise<void> {
    const reaction = await this.requireReaction(reactionId);
    if (reaction.actorId !== actorId) {
      throw new ForbiddenException('Only the actor may remove this reaction');
    }
    await this.reactions.delete(reaction.id);
  }

  private async requireActiveTarget(
    targetType: ReactionTargetType,
    targetId: string,
  ): Promise<{ ownerId: string }> {
    switch (targetType) {
      case 'post': {
        const post = await this.posts.findActiveById(targetId);
        if (!post) {
          throw new NotFoundException('Post not found');
        }
        return { ownerId: post.authorId };
      }
      case 'review': {
        const review = await this.reviews.findActiveById(targetId);
        if (!review) {
          throw new NotFoundException('Review not found');
        }
        return { ownerId: review.authorId };
      }
      case 'comment': {
        const comment = await this.comments.findActiveById(targetId);
        if (!comment) {
          throw new NotFoundException('Comment not found');
        }
        return { ownerId: comment.authorId };
      }
      case 'collection': {
        const collection = await this.collections.findActiveById(targetId);
        if (!collection) {
          throw new NotFoundException('Collection not found');
        }
        return { ownerId: collection.ownerId };
      }
      case 'tier_list': {
        const tierList = await this.tierLists.findActiveById(targetId);
        if (!tierList) {
          throw new NotFoundException('Tier list not found');
        }
        return { ownerId: tierList.ownerId };
      }
      default: {
        const _exhaustive: never = targetType;
        return _exhaustive;
      }
    }
  }

  private async notifyLike(input: {
    recipientId: string;
    actorId: string;
    targetType: ReactionTargetType;
    targetId: string;
  }): Promise<void> {
    if (input.recipientId === input.actorId) {
      return;
    }
    await this.notifications.create({
      recipient: { connect: { id: input.recipientId } },
      kind: 'like',
      objectType: reactionTargetAsObjectType(input.targetType),
      objectId: input.targetId,
    });
  }

  private async requireReaction(reactionId: string): Promise<Reaction> {
    const reaction = await this.reactions.findById(reactionId);
    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }
    return reaction;
  }

  private async project(reaction: Reaction): Promise<ReactionResponse> {
    const actor = await this.requireUser(reaction.actorId);
    return toReactionResponse(reaction, actor);
  }

  private async requireUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('Actor not found');
    }
    return user;
  }
}

function reactionTargetAsObjectType(targetType: ReactionTargetType): ObjectType {
  return targetType;
}
