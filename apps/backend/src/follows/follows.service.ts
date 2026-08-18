import type { BlockRepository, FollowRepository, User, UserRepository } from '@gmrlog/database';
import type { FollowResponse, UserPublicResponse } from '@gmrlog/types';
import type { FollowCreateInput } from '@gmrlog/validators';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { BLOCK_REPOSITORY } from '../blocks/blocks.tokens';

import { FOLLOW_REPOSITORY, FOLLOW_USER_REPOSITORY } from './follows.tokens';
import { toFollowResponse, toUserPublicResponse } from './mappers/follow.mapper';

/**
 * Follow domain service (F6.3 / D2.11). Directed follow edges only.
 * No suggestions · feed · notifications · private requests.
 */
@Injectable()
export class FollowsService {
  constructor(
    @Inject(FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
    @Inject(FOLLOW_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(BLOCK_REPOSITORY) private readonly blocks: BlockRepository,
  ) {}

  async listFollowers(subjectUserId: string): Promise<UserPublicResponse[]> {
    await this.requireActiveUser(subjectUserId);
    const rows = await this.follows.listFollowers(subjectUserId);
    return this.projectUsers(rows.map((row) => row.followerId));
  }

  async listFollowing(subjectUserId: string): Promise<UserPublicResponse[]> {
    await this.requireActiveUser(subjectUserId);
    const rows = await this.follows.listFollowing(subjectUserId);
    return this.projectUsers(rows.map((row) => row.followeeId));
  }

  async followUser(actorId: string, input: FollowCreateInput): Promise<FollowResponse> {
    if (actorId === input.userId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const followee = await this.requireActiveUser(input.userId);

    // Bug 9 — blocking someone did nothing to stop them following you. The edge
    // is checked in both directions because a block is meant to be symmetric in
    // effect: the person you blocked must not be able to reach you, and you
    // should not be able to attach yourself to someone who blocked you.
    // `ConflictException` and this message match `FriendsService.assertNotBlocked`,
    // so the two relationship surfaces answer a blocked interaction identically.
    if (await this.blocks.existsEitherDirection(actorId, input.userId)) {
      throw new ConflictException('Cannot interact with a blocked user');
    }

    const existing = await this.follows.findByPair(actorId, input.userId);
    if (existing) {
      throw new ConflictException('Already following this user');
    }

    const created = await this.follows.create({
      follower: { connect: { id: actorId } },
      followee: { connect: { id: input.userId } },
    });
    const follower = await this.requireActiveUser(actorId);
    return toFollowResponse(created, follower, followee);
  }

  async unfollowUser(actorId: string, followeeId: string): Promise<void> {
    await this.requireActiveUser(followeeId);
    const deleted = await this.follows.deleteByPair(actorId, followeeId);
    if (!deleted) {
      throw new NotFoundException('Follow relationship not found');
    }
  }

  private async requireActiveUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async projectUsers(userIds: string[]): Promise<UserPublicResponse[]> {
    if (userIds.length === 0) {
      return [];
    }
    const loaded = await this.users.findManyByIds(userIds);
    const byId = new Map(loaded.map((user) => [user.id, user]));
    return userIds.flatMap((id) => {
      const user = byId.get(id);
      if (user == null || user.deletedAt != null) {
        return [];
      }
      return [toUserPublicResponse(user)];
    });
  }
}
