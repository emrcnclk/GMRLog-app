import type {
  CollectionRepository,
  Comment,
  CommentHostType,
  CommentRepository,
  NotificationRepository,
  ObjectType,
  PostRepository,
  ReviewRepository,
  TierListRepository,
  User,
  UserRepository,
} from '@gmrlog/database';
import type { CommentResponse } from '@gmrlog/types';
import type { CommentCreateInput, CommentPatchInput } from '@gmrlog/validators';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { FeedFanoutPublisher } from '../infrastructure/jobs/feed-fanout.publisher';
import { notifyMentions } from '../notifications/notify-mentions';

import {
  COMMENT_COLLECTION_REPOSITORY,
  COMMENT_NOTIFICATION_REPOSITORY,
  COMMENT_POST_REPOSITORY,
  COMMENT_REPOSITORY,
  COMMENT_REVIEW_REPOSITORY,
  COMMENT_TIER_LIST_REPOSITORY,
  COMMENT_USER_REPOSITORY,
} from './comments.tokens';
import { toCommentResponse } from './mappers/comment.mapper';

/** Max nest depth: root=0, reply-to-root=1, reply-to-reply=2. */
const COMMENT_MAX_DEPTH = 2;

/**
 * Comment domain service (F6.3 / D3.21). Owns comment create/list/edit/delete,
 * reply depth ≤2, host types post · review · collection · tier_list, soft-delete,
 * host-owner notifications, and ActivityItem fan-out (`comment`).
 */
@Injectable()
export class CommentsService {
  constructor(
    @Inject(COMMENT_REPOSITORY) private readonly comments: CommentRepository,
    @Inject(COMMENT_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(COMMENT_POST_REPOSITORY) private readonly posts: PostRepository,
    @Inject(COMMENT_REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
    @Inject(COMMENT_COLLECTION_REPOSITORY) private readonly collections: CollectionRepository,
    @Inject(COMMENT_TIER_LIST_REPOSITORY) private readonly tierLists: TierListRepository,
    @Inject(COMMENT_NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepository,
    private readonly feedFanout: FeedFanoutPublisher,
  ) {}

  async listByHost(hostType: CommentHostType, hostId: string): Promise<CommentResponse[]> {
    await this.requireHost(hostType, hostId);
    const rows = await this.comments.listByHost(hostType, hostId);
    return this.projectMany(rows);
  }

  async createComment(authorId: string, input: CommentCreateInput): Promise<CommentResponse> {
    const host = await this.requireHost(input.hostType, input.hostId);

    if (input.parentCommentId !== undefined) {
      await this.requireActiveReplyParent(input.parentCommentId, input.hostType, input.hostId);
    }

    const created = await this.comments.create({
      author: { connect: { id: authorId } },
      hostType: input.hostType,
      hostId: input.hostId,
      body: input.body,
      ...(input.parentCommentId !== undefined
        ? { parent: { connect: { id: input.parentCommentId } } }
        : {}),
    });

    await this.notifyHostOwner({
      recipientId: host.ownerId,
      actorId: authorId,
      commentId: created.id,
      isReply: input.parentCommentId !== undefined,
    });

    await notifyMentions({
      body: created.body,
      actorId: authorId,
      objectType: 'comment',
      objectId: created.id,
      users: this.users,
      notifications: this.notifications,
    });

    await this.feedFanout.publish({
      kind: 'comment',
      objectId: created.id,
      objectType: 'comment',
      actorId: authorId,
      occurredAt: created.createdAt,
    });

    return this.project(created);
  }

  async updateComment(
    commentId: string,
    actorId: string,
    input: CommentPatchInput,
  ): Promise<CommentResponse> {
    const comment = await this.requireActiveComment(commentId);
    if (comment.authorId !== actorId) {
      throw new ForbiddenException('Only the author may edit this comment');
    }
    const updated = await this.comments.update(comment.id, { body: input.body });
    return this.project(updated);
  }

  /**
   * S2 §13 — soft-delete only. Replies are not cascaded; they remain as flat
   * rows under the same host (parent may be soft-deleted).
   */
  async deleteComment(commentId: string, actorId: string): Promise<void> {
    const comment = await this.requireActiveComment(commentId);
    if (comment.authorId !== actorId) {
      throw new ForbiddenException('Only the author may delete this comment');
    }
    await this.comments.softDelete(comment.id);
  }

  private async requireHost(
    hostType: CommentHostType,
    hostId: string,
  ): Promise<{ ownerId: string }> {
    switch (hostType) {
      case 'post': {
        const post = await this.posts.findActiveById(hostId);
        if (!post) {
          throw new NotFoundException('Post not found');
        }
        return { ownerId: post.authorId };
      }
      case 'review': {
        const review = await this.reviews.findActiveById(hostId);
        if (!review) {
          throw new NotFoundException('Review not found');
        }
        return { ownerId: review.authorId };
      }
      case 'collection': {
        const collection = await this.collections.findActiveById(hostId);
        if (!collection) {
          throw new NotFoundException('Collection not found');
        }
        return { ownerId: collection.ownerId };
      }
      case 'tier_list': {
        const tierList = await this.tierLists.findActiveById(hostId);
        if (!tierList) {
          throw new NotFoundException('Tier list not found');
        }
        return { ownerId: tierList.ownerId };
      }
      default: {
        const _exhaustive: never = hostType;
        return _exhaustive;
      }
    }
  }

  private async requireActiveReplyParent(
    parentCommentId: string,
    hostType: CommentHostType,
    hostId: string,
  ): Promise<Comment> {
    const parent = await this.comments.findActiveById(parentCommentId);
    if (!parent) {
      throw new NotFoundException('Parent comment not found');
    }
    if (parent.hostType !== hostType || parent.hostId !== hostId) {
      throw new BadRequestException('Parent comment does not belong to this host');
    }
    const parentDepth = await this.depthOf(parent);
    if (parentDepth + 1 > COMMENT_MAX_DEPTH) {
      throw new BadRequestException('Comment reply depth exceeds maximum of 2');
    }
    return parent;
  }

  /** Root = 0, reply-to-root = 1, reply-to-reply = 2. */
  private async depthOf(comment: Comment): Promise<number> {
    if (comment.parentCommentId === null) {
      return 0;
    }
    const parent = await this.comments.findById(comment.parentCommentId);
    if (parent?.parentCommentId == null) {
      return 1;
    }
    return 2;
  }

  private async requireActiveComment(commentId: string): Promise<Comment> {
    const comment = await this.comments.findActiveById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  private async notifyHostOwner(input: {
    recipientId: string;
    actorId: string;
    commentId: string;
    isReply: boolean;
  }): Promise<void> {
    if (input.recipientId === input.actorId) {
      return;
    }
    const objectType: ObjectType = 'comment';
    await this.notifications.create({
      recipient: { connect: { id: input.recipientId } },
      kind: input.isReply ? 'reply' : 'comment',
      objectType,
      objectId: input.commentId,
    });
  }

  private async project(comment: Comment): Promise<CommentResponse> {
    const author = await this.requireUser(comment.authorId);
    return toCommentResponse(comment, author);
  }

  private async projectMany(rows: Comment[]): Promise<CommentResponse[]> {
    if (rows.length === 0) {
      return [];
    }
    const authorsById = await this.loadUsersById(rows.map((row) => row.authorId));
    return rows.map((row) =>
      toCommentResponse(row, this.requireLoadedUser(authorsById, row.authorId)),
    );
  }

  private async requireUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (user == null) {
      throw new NotFoundException('Author not found');
    }
    if (user.deletedAt != null) {
      throw new NotFoundException('Author not found');
    }
    return user;
  }

  private async loadUsersById(userIds: string[]): Promise<Map<string, User>> {
    const unique = [...new Set(userIds)];
    const loaded = await this.users.findManyByIds(unique);
    return new Map(loaded.map((user) => [user.id, user]));
  }

  private requireLoadedUser(usersById: Map<string, User>, userId: string): User {
    const user = usersById.get(userId);
    if (!user) {
      throw new NotFoundException('Author not found');
    }
    return user;
  }
}
