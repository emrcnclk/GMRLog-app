import type {
  FollowRepository,
  Game,
  GameRepository,
  Prisma,
  Review,
  ReviewRepository,
  User,
  UserRepository,
} from '@gmrlog/database';
import type { ReviewResponse } from '@gmrlog/types';
import type { ReviewCreateInput, ReviewPatchInput } from '@gmrlog/validators';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { isAuthenticatedIdentity, type RequestIdentity } from '../auth/interfaces/identity';
import { FOLLOW_REPOSITORY } from '../follows/follows.tokens';
import { FeedFanoutPublisher } from '../infrastructure/jobs/feed-fanout.publisher';
import { SearchIndexPublisher } from '../infrastructure/jobs/search-index.publisher';

import { canViewerReadReview, toReviewResponse } from './mappers/review.mapper';
import {
  REVIEW_GAME_REPOSITORY,
  REVIEW_REPOSITORY,
  REVIEW_USER_REPOSITORY,
} from './reviews.tokens';

/**
 * Review domain service (F6.3). Owns review CRUD, one-active-review-per
 * (author, game) uniqueness, spoiler flag persistence, and visibility gating.
 * Comments · reactions · moderation are out of scope.
 */
@Injectable()
export class ReviewsService {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
    @Inject(REVIEW_GAME_REPOSITORY) private readonly games: GameRepository,
    @Inject(REVIEW_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
    private readonly feedFanout: FeedFanoutPublisher,
    private readonly searchIndex: SearchIndexPublisher,
  ) {}

  async getReview(reviewId: string, identity: RequestIdentity): Promise<ReviewResponse> {
    const review = await this.requireActiveReview(reviewId);
    await this.assertReadable(review, identity);
    const [author, game] = await Promise.all([
      this.requireUser(review.authorId),
      this.games.findById(review.gameId),
    ]);
    return toReviewResponse(review, author, game ?? undefined);
  }

  async listGameReviews(gameId: string, identity: RequestIdentity): Promise<ReviewResponse[]> {
    await this.requireGame(gameId);
    const rows = await this.reviews.listByGame(gameId);
    const viewerId = viewerIdOf(identity);
    const visible: Review[] = [];
    for (const review of rows) {
      if (await this.isReadable(review.visibility, review.authorId, viewerId)) {
        visible.push(review);
      }
    }
    if (visible.length === 0) {
      return [];
    }
    const authorsById = await this.loadUsersById(visible.map((row) => row.authorId));
    const game = await this.games.findById(gameId);
    return visible.map((row) =>
      toReviewResponse(row, this.requireLoadedUser(authorsById, row.authorId), game ?? undefined),
    );
  }

  async createReview(authorId: string, input: ReviewCreateInput): Promise<ReviewResponse> {
    await this.requireGame(input.gameId);
    const existing = await this.reviews.findActiveByAuthorAndGame(authorId, input.gameId);
    if (existing) {
      throw new ConflictException('A review already exists for this game');
    }

    const created = await this.reviews.create({
      author: { connect: { id: authorId } },
      game: { connect: { id: input.gameId } },
      rating: input.rating,
      visibility: input.visibility ?? 'public',
      containsSpoilers: input.containsSpoilers ?? false,
      ...(input.body !== undefined ? { body: input.body } : {}),
    });
    await this.writeReviewActivity(authorId, created);
    await this.searchIndex.publishUpsert('review', created.id);
    return this.project(created);
  }

  async updateReview(
    reviewId: string,
    actorId: string,
    input: ReviewPatchInput,
  ): Promise<ReviewResponse> {
    const review = await this.requireActiveReview(reviewId);
    this.assertAuthor(review, actorId);

    const data: Prisma.ReviewUpdateInput = {
      version: { increment: 1 },
    };
    if (input.rating !== undefined) {
      data.rating = input.rating;
    }
    if (input.body !== undefined) {
      data.body = input.body;
    }
    if (input.containsSpoilers !== undefined) {
      data.containsSpoilers = input.containsSpoilers;
    }
    if (input.visibility !== undefined) {
      data.visibility = input.visibility;
    }

    const updated = await this.reviews.update(review.id, data);
    await this.searchIndex.publishUpsert('review', updated.id);
    return this.project(updated);
  }

  /**
   * S2 §13 — soft-delete. Comments are deferred; no orphan comment cleanup here.
   */
  async deleteReview(reviewId: string, actorId: string): Promise<void> {
    const review = await this.requireActiveReview(reviewId);
    this.assertAuthor(review, actorId);
    await this.reviews.softDelete(review.id);
    await this.searchIndex.publishDelete('review', review.id);
  }

  private async writeReviewActivity(authorId: string, created: Review): Promise<void> {
    await this.feedFanout.publish({
      kind: 'review',
      objectId: created.id,
      actorId: authorId,
      occurredAt: created.createdAt,
    });
  }

  private async project(review: Review): Promise<ReviewResponse> {
    const [author, game] = await Promise.all([
      this.requireUser(review.authorId),
      this.games.findById(review.gameId),
    ]);
    return toReviewResponse(review, author, game ?? undefined);
  }

  private async requireActiveReview(reviewId: string): Promise<Review> {
    const review = await this.reviews.findActiveById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }

  private async requireGame(gameId: string): Promise<Game> {
    const game = await this.games.findById(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return game;
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

  private assertAuthor(review: Review, actorId: string): void {
    if (review.authorId !== actorId) {
      throw new ForbiddenException('Only the author may modify this review');
    }
  }

  private async assertReadable(review: Review, identity: RequestIdentity): Promise<void> {
    if (!(await this.isReadable(review.visibility, review.authorId, viewerIdOf(identity)))) {
      throw new NotFoundException('Review not found');
    }
  }

  private async isReadable(
    visibility: Review['visibility'],
    authorId: string,
    viewerId: string | null,
  ): Promise<boolean> {
    let viewerFollowsAuthor = false;
    if (visibility === 'followers' && viewerId != null && viewerId !== authorId) {
      viewerFollowsAuthor = await this.follows.exists(viewerId, authorId);
    }
    return canViewerReadReview(visibility, authorId, viewerId, viewerFollowsAuthor);
  }
}

function viewerIdOf(identity: RequestIdentity): string | null {
  return isAuthenticatedIdentity(identity) ? identity.userId : null;
}
